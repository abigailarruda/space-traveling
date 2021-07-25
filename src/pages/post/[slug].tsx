import Head from 'next/head';
import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const postDate = format(
    new Date(post?.first_publication_date || Date.now()),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  const readingTime: number = Math.ceil(
    post?.data.content.reduce((total, item) => {
      total += item.heading.split(' ').length;

      total += RichText.asText(item.body).split(' ').length;

      return total;
    }, 0) / 200
  );

  if (router.isFallback) {
    return (
      <main className={styles.container}>
        <article className={commonStyles.maxWidth}>
          <p className={styles.postFallback}>Carregando...</p>
        </article>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>{post?.data.title} | spacetraveling.</title>
      </Head>

      <main className={styles.container}>
        <img src={post?.data.banner.url} alt={post?.data.title} />
        <article className={`${styles.post} ${commonStyles.maxWidth}`}>
          <h1>{post?.data.title}</h1>

          <div className={commonStyles.postInfo}>
            <span>
              <FiCalendar />
              {postDate}
            </span>

            <span>
              <FiUser />
              {post?.data.author}
            </span>

            <span>
              <FiClock />
              {`${readingTime} min`}
            </span>
          </div>

          <div className={styles.postContent}>
            {post?.data.content.map(content => {
              return (
                <div key={content.heading}>
                  <h2>{content.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {}
  );

  const paths = postsResponse.results.map(post => {
    return {
      params: {
        slug: post?.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: { post },
    revalidate: 60 * 30, // 30 minutos
  };
};
