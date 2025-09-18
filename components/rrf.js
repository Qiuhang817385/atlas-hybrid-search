// Reciprocal Rank Fusion
import { useState, useEffect } from "react";
import axios from "axios";
import Results from "./results"
import SetParams from "./set-params";
import { useToast } from '@leafygreen-ui/toast';
import { useApp } from "../context/AppContext";
import { searchStage } from "../lib/pipelineStages";

function RRF ({ query, queryVector }) {
  const { pushToast } = useToast();
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const { schema } = useApp();
  // CONFIGURATION PARAMETERS
  const defaultConfig = {
    vector_weight: { val: 1, range: [0, 20], step: 1, comment: "Weight the vector results" },
    fts_weight: { val: 1, range: [0, 20], step: 1, comment: "Weight the text results" },
    limit: { val: 10, range: [1, 25], step: 1, comment: "Number of results to return" },
    numCandidates: { val: 100, range: [1, 625], step: 1, comment: "How many candidates to retrieve from the vector search" },
  }
  const [config, setConfig] = useState(defaultConfig)
  const resetConfig = () => {
    setConfig(defaultConfig);
  }

  useEffect(() => {
    if (queryVector) {
      setLoading(true);
      search(query, queryVector, config, schema)
        .then(resp => {
          setResponse(resp.data);
          setLoading(false);
        })
        .catch(error => {
          pushToast({ timeout: 10000, variant: "warning", title: "API Failure", description: `Search query failed. ${error}` });
          console.log(error);
        });
    }

  }, [queryVector, config]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "20% 80%", gap: "5px", alignItems: "start" }}>
      <SetParams loading={loading} config={config} resetConfig={resetConfig} setConfig={setConfig} heading="Reciprocal Rank Fusion Params" />
      <Results queryText={query} response={response} msg={"numCandidates: " + (config.numCandidates.val)} hybrid={true} noResultsMsg={"No Results. Select 'Vector Search' to run a vector query."} />
    </div>
  )
}

export default RRF;

async function search (query, queryVector, config, schema) {
  const pipeline = [
    // 向量搜索阶段
    {
      $vectorSearch: {
        index: '',
        path: `${schema.vectorField}`,
        queryVector: queryVector,
        numCandidates: config.numCandidates.val,
        limit: config.limit.val
      }
    },
    {
      $addFields: {
        vs_score: {
          $meta: 'vectorSearchScore'
        },
        vs_rank: {
          $add: [{ $meta: 'vectorSearchScore' }, 0] // 临时字段，稍后会重新计算排名
        }
      }
    },
    {
      $project: {
        vs_score: 1,
        _id: 1,
        title: `$${schema.titleField}`,
        image: `$${schema.imageField}`,
        description: `$${schema.descriptionField}`,
        ...schema.searchFields.reduce((acc, f) => ({ ...acc, [f]: 1 }), {})
      }
    },
    // 合并全文搜索结果
    {
      $unionWith: {
        coll: '',
        pipeline: [
          searchStage(query, schema),
          {
            $limit: config.limit.val
          },
          {
            $addFields: {
              fts_score: {
                $meta: 'searchScore'
              },
              fts_rank: {
                $add: [{ $meta: 'searchScore' }, 0] // 临时字段，稍后会重新计算排名
              }
            }
          },
          {
            $project: {
              fts_score: 1,
              _id: 1,
              title: `$${schema.titleField}`,
              image: `$${schema.imageField}`,
              description: `$${schema.descriptionField}`,
              ...schema.searchFields.reduce((acc, f) => ({ ...acc, [f]: 1 }), {})
            }
          }
        ]
      }
    },
    // 按文档ID分组，合并结果
    {
      $group: {
        _id: "$_id",
        vs_score: { $max: "$vs_score" },
        fts_score: { $max: "$fts_score" },
        title: { $first: "$title" },
        image: { $first: "$image" },
        description: { $first: "$description" },
        ...schema.searchFields.reduce((acc, f) => ({ ...acc, [f]: { $first: `$${f}` } }), {})
      }
    },
    // 计算 Reciprocal Rank Fusion 分数
    {
      $addFields: {
        vs_score: { $ifNull: ["$vs_score", 0] },
        fts_score: { $ifNull: ["$fts_score", 0] }
      }
    },
    // 按分数排序并添加排名
    {
      $sort: { vs_score: -1 }
    },
    {
      $group: {
        _id: null,
        docs: { $push: "$$ROOT" }
      }
    },
    {
      $unwind: {
        path: "$docs",
        includeArrayIndex: "vs_rank"
      }
    },
    {
      $replaceRoot: { newRoot: "$docs" }
    },
    {
      $addFields: {
        vs_rank: { $add: ["$vs_rank", 1] } // 排名从1开始
      }
    },
    // 再次按全文搜索分数排序并添加排名
    {
      $sort: { fts_score: -1 }
    },
    {
      $group: {
        _id: null,
        docs: { $push: "$$ROOT" }
      }
    },
    {
      $unwind: {
        path: "$docs",
        includeArrayIndex: "fts_rank"
      }
    },
    {
      $replaceRoot: { newRoot: "$docs" }
    },
    {
      $addFields: {
        fts_rank: { $add: ["$fts_rank", 1] } // 排名从1开始
      }
    },
    // 计算 RRF 分数
    {
      $addFields: {
        rrf_vs_score: {
          $cond: [
            { $gt: ["$vs_score", 0] },
            { $multiply: [config.vector_weight.val, { $divide: [1, { $add: [60, "$vs_rank"] }] }] },
            0
          ]
        },
        rrf_fts_score: {
          $cond: [
            { $gt: ["$fts_score", 0] },
            { $multiply: [config.fts_weight.val, { $divide: [1, { $add: [60, "$fts_rank"] }] }] },
            0
          ]
        }
      }
    },
    {
      $addFields: {
        score: {
          $add: ["$rrf_vs_score", "$rrf_fts_score"]
        }
      }
    },
    // 按最终分数排序
    {
      $sort: { score: -1 }
    },
    {
      $limit: config.limit.val
    },
    {
      $project: {
        _id: 1,
        vs_score: 1,
        fts_score: 1,
        vs_rank: 1,
        fts_rank: 1,
        rrf_vs_score: 1,
        rrf_fts_score: 1,
        score: 1,
        title: 1,
        image: 1,
        description: 1,
        ...schema.searchFields.reduce((acc, f) => ({ ...acc, [f]: `$${f}` }), {})
      }
    }
  ]
  return new Promise((resolve, reject) => {
    axios.post(`api/search`,
      {
        pipeline: pipeline
      },
    ).then(response => resolve(response))
      .catch((error) => {
        reject(error.response.data.error);
      })
  });
}
