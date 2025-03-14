import { SideNavigationProps } from '@cloudscape-design/components';

export const navigationItems: SideNavigationProps.Item[] = [
  { href: '/', text: 'Home', type: 'link' },
  { type: 'divider' },
  { href: '/submissions', text: 'Submissions', type: 'link' },
  { type: 'divider' },
  {
    type: 'section',
    text: 'Administration',
    items: [
      { href: '/users', text: 'Users', type: 'link' },
      { href: '/settings', text: 'Settings', type: 'link' },
    ],
  },
  { type: 'divider' },
  {
    external: true,
    href: 'https://docs.aws.amazon.com',
    text: 'Documentation',
    type: 'link',
  },
];

export const spacerSvg = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  ></svg>
);
