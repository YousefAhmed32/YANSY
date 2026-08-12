import * as Icons from 'lucide-react';

/**
 * Resolves a `sectionItem.icon` string (e.g. "GraduationCap", stored by the
 * admin editor's icon picker) to the matching lucide-react component at
 * render time, falling back to a neutral dot if the name is missing/stale —
 * never a broken import, since the icon is just admin-entered data, not a
 * build-time import.
 */
const ProposalIcon = ({ name, ...props }) => {
  const Cmp = (name && Icons[name]) || Icons.Circle;
  return <Cmp aria-hidden="true" {...props} />;
};

export default ProposalIcon;
