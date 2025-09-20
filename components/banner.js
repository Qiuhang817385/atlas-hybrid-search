import { MongoDBLogoMark } from "@leafygreen-ui/logo";
import { H1, H2 } from "@leafygreen-ui/typography";
import { useApp } from '../context/AppContext';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';

function AppBanner ({ heading, children }) {
  const { model } = useApp();
  const t = useTranslations();

  return (
    <div>
      <div style={{ marginRight: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <H1><MongoDBLogoMark />{heading}</H1>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div>
              <p>{t('embeddings.provider', { provider: model.embedding?.provider, model: model.embedding?.model })}</p>
              {model.reranking?.provider ? <p>{t('embeddings.reranking', { provider: model.reranking?.provider, model: model.reranking?.model })}</p> : <></>}
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
      <div>
        {children}
      </div>
    </div>
  )
}

export default AppBanner;