import styles from './FullPageLoader.module.scss';

interface FullPageLoaderProps {
  label?: string;
}

export const FullPageLoader = ({ label = '' }: FullPageLoaderProps) => {
  return (
    <div className={styles.container}>
      <div className={styles.loader} />
      <div className={styles.label}>{label}</div>
    </div>
  );
};
