import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileQuestion, Clock3, Download } from 'lucide-react';
import api from '../utils/api';
import { useSEO } from '../hooks/useSEO';
import ProposalRenderer from '../components/proposal-template/ProposalRenderer';
import ImportedHTMLViewer from '../components/imported-html/ImportedHTMLViewer';

const EmptyState = (props) => {
  const Icon = props.Icon;
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '2rem', fontFamily: "'IBM Plex Sans Arabic', system-ui, sans-serif",
    }} dir="rtl">
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <Icon size={24} color="#6B7280" aria-hidden="true" />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>{props.title}</h1>
      <p style={{ fontSize: 14, color: '#6B7280', marginTop: 8, maxWidth: 380 }}>{props.body}</p>
    </div>
  );
};

const Loader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div aria-label="Loading" role="status" style={{
      width: 32, height: 32, borderRadius: '50%', border: '2px solid #E7EAF0', borderTopColor: '#2563EB',
      animation: 'proposal-spin 0.75s linear infinite',
    }} />
    <style>{'@keyframes proposal-spin { to { transform: rotate(360deg) } }'}</style>
  </div>
);

/**
 * Public, unauthenticated proposal page — `/p/:slug`. No site Header/Footer:
 * a shared proposal link is meant to read as its own branded document (see
 * ProposalRenderer), not as a page nested inside the marketing site's nav.
 */
const ProposalPublicPage = () => {
  const { slug } = useParams();
  const [state, setState] = useState({ status: 'loading', proposal: null, expired: null });
  const viewFired = useRef(false);

  useEffect(() => {
    let cancelled = false;
    // Resets to the loading state whenever `slug` changes (e.g. navigating
    // between two proposal links without a full page reload) — same
    // intentional-synchronous-setState pattern as hooks/useReveal.js.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: 'loading', proposal: null, expired: null });
    viewFired.current = false;

    api.get(`/public/proposals/${slug}`)
      .then(({ data }) => {
        if (cancelled) return;
        if (data.expired) {
          setState({ status: 'expired', proposal: data.item, expired: true });
          return;
        }
        setState({ status: 'ready', proposal: data.item, expired: false });

        // Fired once per mount, after a successful load — never on retries/
        // re-renders (see publicProposalController.recordView).
        if (!viewFired.current) {
          viewFired.current = true;
          api.post(`/public/proposals/${slug}/view`).catch(() => {});
        }
      })
      .catch(() => { if (!cancelled) setState({ status: 'not-found', proposal: null, expired: null }); });

    return () => { cancelled = true; };
  }, [slug]);

  const seoTitle = state.proposal?.project?.title
    ? `${state.proposal.project.title} | YANSY Tech`
    : undefined;
  useSEO({ title: seoTitle, noIndex: true });

  const handleAccept = async (form) => {
    await api.post(`/public/proposals/${slug}/accept`, form);
  };
  const handleRequestChanges = async (form) => {
    await api.post(`/public/proposals/${slug}/request-changes`, form);
  };
  const handleDownloadPdf = () => {
    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
    window.open(`${base}/public/proposals/${slug}/pdf`, '_blank', 'noopener,noreferrer');
  };

  if (state.status === 'loading') return <Loader />;

  if (state.status === 'not-found') {
    return (
      <EmptyState
        Icon={FileQuestion}
        title="هذا العرض غير متاح"
        body="تحقق من الرابط أو تواصل مع مُرسِل العرض."
      />
    );
  }

  if (state.status === 'expired') {
    return (
      <EmptyState
        Icon={Clock3}
        title="انتهت صلاحية هذا العرض"
        body="يرجى التواصل مع YANSY Tech لتجديد العرض."
      />
    );
  }

  // IMPORTED_HTML: the hosted document *is* the page — no Hero/Footer/
  // action-bar chrome wrapped around it, so it reads as a standalone
  // document rather than a page embedded inside another product. The one
  // necessary bit of outer UI is a small, unobtrusive PDF button (§23 of
  // the import-feature spec still requires PDF export for this type).
  if (state.proposal?.type === 'IMPORTED_HTML') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100dvh' }}>
        <ImportedHTMLViewer htmlAssetUrl={state.proposal.htmlAssetUrl} title={state.proposal.project?.title || 'Proposal'} height="100dvh" />
        <button
          type="button"
          onClick={handleDownloadPdf}
          aria-label="Download PDF"
          style={{
            position: 'fixed', bottom: 18, insetInlineEnd: 18, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(13,17,23,.85)', color: '#fff', border: 'none',
            borderRadius: 100, padding: '10px 16px', fontSize: 12.5, fontWeight: 600,
            cursor: 'pointer', backdropFilter: 'blur(6px)', boxShadow: '0 8px 24px rgba(0,0,0,.25)',
          }}
        >
          <Download size={14} aria-hidden="true" />
          PDF
        </button>
      </div>
    );
  }

  return (
    <ProposalRenderer
      proposal={state.proposal}
      mode="public"
      onAccept={handleAccept}
      onRequestChanges={handleRequestChanges}
      onDownloadPdf={handleDownloadPdf}
    />
  );
};

export default ProposalPublicPage;
