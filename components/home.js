import { Analytics } from "@vercel/analytics/next"

import axios from 'axios';
import Header from './head';
import RSF from './rsf';
import RRF from './rrf';
import FTS from './fts';
import VS from './vs';
import RerankFusion from './rerankFusion';
import SemanticBoosting from './semanticBoosting';
import { SearchInput } from '@leafygreen-ui/search-input';
import { useState, } from 'react';
import Button from '@leafygreen-ui/button';
import { Tabs, Tab } from '@leafygreen-ui/tabs';
import AppBanner from './banner';
import { useToast } from '@leafygreen-ui/toast';
import { useApp } from '../context/AppContext';
import LoadingIndicator from './LoadingIndicator';
import Modal from '@leafygreen-ui/modal';
import Code from '@leafygreen-ui/code';
import ExpandableCard from '@leafygreen-ui/expandable-card';
import { useTranslations } from 'next-intl';

const Home = () => {
  const { pushToast } = useToast();
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [queryVector, setQueryVector] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const { indexes, sample } = useApp();

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      handleSearch();
    }
  }

  const handleSearch = () => {
    console.log("Search Clicked!")
    if (query && query != "") {
      setLoading(true);
      getQueryCache(query)
        .then(resp => {
          if (resp) {
            console.log("Got cached query vector!");
            pushToast({ timeout: 10000, variant: "note", title: t('toasts.cacheHit'), description: t('toasts.usedCachedEmbedding', { query }) });
            setQueryVector(resp);
            setLoading(false);
          } else {
            embedQuery(query)
              .then(resp => {
                console.log("Query Embedded!")
                setQueryVector(resp);
                setLoading(false);
              })
              .catch(error => {
                console.log(error);
                pushToast({ timeout: 10000, variant: "warning", title: t('toasts.apiFailure'), description: t('toasts.failedToEncode', { error }) });
              });
          }
        })
        .catch(error => {
          console.log(error);
          pushToast({ timeout: 10000, variant: "warning", title: t('toasts.apiFailure'), description: t('toasts.failedToAccessCache', { error }) });
        });
    }
  }

  const handleQueryChange = (event) => {
    console.log('event.target.value', event.target.value)
    setQuery(event.target.value);
    getQueryCache(event.target.value)
      .then(resp => {
        if (resp) {
          console.log("Got cached query vector!");
          pushToast({ timeout: 10000, variant: "note", title: t('toasts.cacheHit'), description: t('toasts.usedCachedEmbedding', { query: event.target.value }) });
          setQueryVector(resp);
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  return (
    <>
      <Analytics />
      <Header />
      <AppBanner heading={t('app.title')}></AppBanner>
      <div style={{ display: "grid", gridTemplateColumns: "90% 120px", gap: "10px", alignItems: "start" }}>
        <div><SearchInput value={query} onChange={handleQueryChange} onKeyDown={(e) => handleKeyPress(e)} aria-label={t('app.searchPlaceholder')} placeholder={t('app.searchPlaceholder')} style={{ marginBottom: "20px" }}></SearchInput></div>
        <div style={{ maxWidth: "120px" }}><Button onClick={() => handleSearch()} variant="primary">{t('app.vectorSearch')}</Button></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "120px 120px", gap: "10px", alignItems: "start" }}>
        <div style={{ maxWidth: "120px" }}><Button onClick={() => setOpen("indexes")}>{t('app.showIndexes')}</Button></div>
        <div style={{ maxWidth: "120px" }}><Button onClick={() => setOpen("sample")}>{t('app.sampleDoc')}</Button></div>
      </div>
      {loading ? <LoadingIndicator /> : <></>}
      <Tabs style={{ marginTop: "15px" }} setSelected={setSelectedTab} selected={selectedTab}>
        <Tab name={t('tabs.about')}>
          <div style={{ margin: "100px", marginTop: "50px" }}>
            <h1>{t('about.title')}</h1>
            <p>{t('about.description')} <a href={t('about.sourceCodeUrl')}>{t('about.sourceCodeUrl')}</a></p>
            <h2>{t('about.hybridStrategies')}</h2>
            <p>{t('about.strategiesDescription')}</p>
            <h3>{t('about.rsf.title')}</h3>
            <p>{t('about.rsf.description')}</p>
            <h3>{t('about.rrf.title')}</h3>
            <p>{t('about.rrf.description')}</p>
            <h3>{t('about.semanticBoosting.title')}</h3>
            <p>{t('about.semanticBoosting.description')}</p>
            <h3>{t('about.rerankFusion.title')}</h3>
            <p>{t('about.rerankFusion.description')}</p>
            <h2>{t('about.reranking.title')}</h2>
            <h3>{t('about.reranking.rerankResults')}</h3>
            <p>{t('about.reranking.description')}</p>
            <h2>{t('about.howToUse.title')}</h2>
            <p>{t('about.howToUse.description')}</p>
          </div>
        </Tab>
        <Tab name={t('tabs.fulltextSearch')}>
          <FTS query={query} />
        </Tab>
        <Tab name={t('tabs.vectorSearch')}>
          <VS query={query} queryVector={queryVector} />
        </Tab>
        <Tab name={t('tabs.relativeScoreFusion')}>
          <RSF query={query} queryVector={queryVector} />
        </Tab>
        <Tab name={t('tabs.reciprocalRankFusion')}>
          <RRF query={query} queryVector={queryVector} />
        </Tab>
        <Tab name={t('tabs.semanticBoosting')}>
          <SemanticBoosting query={query} queryVector={queryVector} />
        </Tab>
        <Tab name={t('tabs.rerankFusion')}>
          <RerankFusion query={query} queryVector={queryVector} />
        </Tab>
      </Tabs>
      <Modal open={open} setOpen={setOpen}>
        {open == "indexes" ?
          <>
            <ExpandableCard
              title={t('modals.atlasSearch')}
              darkMode={false}
            >
              <Code language={'javascript'}>
                {indexes ? JSON.stringify(indexes.searchIndex, null, 2) : ""}
              </Code>
            </ExpandableCard>
            <br />
            <ExpandableCard
              title={t('modals.atlasVectorSearch')}
              darkMode={false}
            >
              <Code language={'javascript'}>
                {indexes ? JSON.stringify(indexes.vectorIndex, null, 2) : ""}
              </Code>
            </ExpandableCard>
          </>
          : open == "sample" ?
            <Code language={'javascript'}>
              {sample ? JSON.stringify(sample, null, 2) : ""}
            </Code>
            : <></>
        }
      </Modal>
    </>
  )
}

async function embedQuery (query) {
  try {
    const embeddingResp = await axios.get('api/embed?terms=' + query);
    return embeddingResp.data;
  } catch (e) {
    throw e;
  }
}

async function getQueryCache (terms) {
  return axios.get(`api/embed/cache?terms=${terms}`)
    .then(response => {
      if (response.status === 204) {
        return null; // Cache miss
      } else if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      } else {
        return response.data; // Cache hit
      }
    })
    .catch(error => {
      throw error;
    });
}

export default Home;