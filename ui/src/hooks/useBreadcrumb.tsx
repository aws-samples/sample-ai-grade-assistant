import { useAppContext } from '../components/AppContext/context';

export interface Breadcrumb {
  text: string;
  href: string;
}

export const useBreadcrumb = () => {
  const { setBreadcrumb } = useAppContext();

  const updateBreadcrumb = (newBreadcrumb: Breadcrumb[]) => {
    setBreadcrumb(newBreadcrumb);
  };

  return updateBreadcrumb;
};
