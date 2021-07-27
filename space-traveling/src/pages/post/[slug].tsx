import Head from 'next/head';
import Link from 'next/link';
import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiClock, FiEdit2, FiUser } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Comments from '../../components/Comments';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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

interface NavigationPost {
  uid?: string;
  data: {
    title: string;
  };
}

interface PostProps {
  preview: boolean;
  post: Post;
  navigation: {
    prevPost: NavigationPost;
    nextPost: NavigationPost;
  };
}

export default function Post({ post, preview, navigation }: PostProps) {
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

  const editedPost =
    post.first_publication_date !== post.last_publication_date
      ? format(
          new Date(post?.last_publication_date || Date.now()),
          "'Editado em' dd MMM yyyy', às' HH':'mm",
          {
            locale: ptBR,
          }
        )
      : null;

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

          {editedPost && (
            <div
              className={commonStyles.postInfo}
              style={{ marginTop: '1rem' }}
            >
              <span>
                <FiEdit2 />
                {editedPost}
              </span>
            </div>
          )}

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

      <hr className={styles.divider} />

      <footer className={styles.container}>
        {navigation && (
          <section className={`${styles.navigation} ${commonStyles.maxWidth}`}>
            {navigation.prevPost ? (
              <div className={styles.prev}>
                <h4>{navigation.prevPost.data.title}</h4>
                <Link href={`/post/${navigation.prevPost.uid}`}>
                  <a>Post anterior</a>
                </Link>
              </div>
            ) : (
              <div />
            )}

            {navigation.nextPost ? (
              <div className={styles.next}>
                <h4>{navigation.nextPost.data.title}</h4>
                <Link href={`/post/${navigation.nextPost.uid}`}>
                  <a>Próximo post</a>
                </Link>
              </div>
            ) : (
              <div />
            )}
          </section>
        )}

        <section className={commonStyles.maxWidth}>
          <Comments />

          {preview && (
            <aside className={commonStyles.exitPreview}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </section>
      </footer>
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const postResponse = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const post = {
    uid: postResponse.uid,
    first_publication_date: postResponse.first_publication_date,
    last_publication_date: postResponse.last_publication_date,
    data: {
      title: postResponse.data.title,
      subtitle: postResponse.data.subtitle,
      author: postResponse.data.author,
      banner: {
        url: postResponse.data.banner.url,
      },
      content: postResponse.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  const nextPostResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: postResponse.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const prevPostResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: postResponse.id,
      orderings: '[document.last_publication_date]',
    }
  );

  const prevPost = prevPostResponse.results[0]
    ? {
        uid: prevPostResponse.results[0].uid,
        data: {
          title: prevPostResponse.results[0].data.title,
        },
      }
    : null;

  const nextPost = nextPostResponse.results[0]
    ? {
        uid: nextPostResponse.results[0].uid,
        data: {
          title: nextPostResponse.results[0].data.title,
        },
      }
    : null;

  const navigation = {
    prevPost,
    nextPost,
  };

  return {
    props: { post, preview, navigation },
    revalidate: 60 * 30, // 30 minutos
  };
};
