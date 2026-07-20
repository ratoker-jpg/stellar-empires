import '../styles/designTokens.css';
import '../styles/uiPrimitives.css';
import '../styles/designSystemSandbox.css';
import { mountDesignSystemSandbox } from './designSystemSandbox';

const url = new URL(window.location.href);
if (!url.searchParams.has('ui-sandbox')) {
  url.searchParams.set('ui-sandbox', '1');
  window.history.replaceState(null, '', url);
}

if (!mountDesignSystemSandbox()) {
  throw new Error('UI sandbox could not be mounted.');
}
