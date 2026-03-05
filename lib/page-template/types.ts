import type { PageContent } from "@/lib/page-types/types";

export interface PageTemplateProps {
  content: PageContent;
  pageType: string;
  fullPath: string;
}

export type PageTemplateComponent = (props: PageTemplateProps) => React.JSX.Element;
