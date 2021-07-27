import styles from './comments.module.scss';

export default function Comments() {
  return (
    <>
      <h3 className={styles.title}>Comentários</h3>
      <section
        className={styles.comments}
        ref={element => {
          if (!element || element.childNodes.length) {
            return;
          }
          const utteranceScript = document.createElement('script');
          utteranceScript.src = 'https://utteranc.es/client.js';
          utteranceScript.async = true;
          utteranceScript.crossOrigin = 'anonymous';
          utteranceScript.setAttribute('repo', 'abigailarruda/space-traveling');
          utteranceScript.setAttribute('issue-term', 'pathname');
          utteranceScript.setAttribute('theme', 'github-light');
          element.appendChild(utteranceScript);
        }}
      />
    </>
  );
}
