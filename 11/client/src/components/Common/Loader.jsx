import React from 'react';
import styles from './Common.module.scss';

const Loader = ({ fullPage = false }) => {
  const loader = (
    <div className={styles.loader}>
      <div className={styles.spinner} />
    </div>
  );

  if (fullPage) {
    return (
      <div className={styles.fullPage}>
        {loader}
      </div>
    );
  }

  return loader;
};

export default Loader;