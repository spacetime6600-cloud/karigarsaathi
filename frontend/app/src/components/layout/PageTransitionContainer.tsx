import React from 'react';
import { PageTransition, PageTransitionProps } from './PageTransition';

export type PageTransitionContainerProps = PageTransitionProps;

/**
 * PageTransitionContainer
 * Reusable page transition container component, aliased to PageTransition.
 */
export const PageTransitionContainer: React.FC<PageTransitionContainerProps> = (props) => {
  return <PageTransition {...props} />;
};

export { PageTransition };
