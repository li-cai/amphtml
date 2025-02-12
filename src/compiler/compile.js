import * as compiler from '@ampproject/bento-compiler';

import {getBuilders} from './builders';

/**
 * Returns the AST for an AMP Document with eligible components server-rendered.
 *
 * @param {import('./types').CompilerRequest} request
 * @return {import('./types').CompilerResponse}
 */
export function compile(request) {
  // eslint-disable-next-line local/camelcase
  const {component_versions: versions, document, nodes} = request ?? {};
  if (!versions || !(document || nodes)) {
    throw new Error(
      'Must provide component_versions and either document or nodes'
    );
  }

  if (document) {
    return {
      document: compiler.renderAstDocument(document, getBuilders(versions)),
    };
  }
  return {nodes: compiler.renderAstNodes(nodes, getBuilders(versions))};
}
