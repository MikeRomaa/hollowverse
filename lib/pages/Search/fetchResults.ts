import levenshtein from 'fast-levenshtein';
import { isEmpty } from 'lodash-es';
import { Required } from 'utility-types';
import {
  KnowledgeGraphCeleb,
  KnowledgeGraphCelebResult,
  knowledgeGraphClient,
} from '~/lib/pages/utils/knowledgeGraphClient';
import { sanityClient } from '~/lib/pages/utils/sanityio';

type CleanedResult = { result: Required<KnowledgeGraphCeleb, 'image'> };
function clean(items: KnowledgeGraphCelebResult[]) {
  return items.filter((i) => {
    return i.result.image;
  }) as CleanedResult[];
}

type HvResult = { knowledgeGraphId: string; slug: string };

async function hvSearch(cleanedKgResults: KnowledgeGraphCelebResult[]) {
  return (await sanityClient.fetch(
    `*[_type == 'celeb' && knowledgeGraphId in ${JSON.stringify(
      cleanedKgResults.map((i) => i.result['@id']),
    )}]{knowledgeGraphId, 'slug': slug.current}`,
  )) as HvResult[];
}

type Combined = ReturnType<typeof combine>;
function combine(kgResults: CleanedResult[], hvResults: HvResult[]) {
  const hasHvResults = !isEmpty(hvResults);

  return {
    hasHvResults,
    results: kgResults.map((kgItem) => ({
      ...kgItem,
      result: {
        ...kgItem.result,
        slug: hvResults.find(
          (hvItem) => hvItem?.knowledgeGraphId === kgItem.result['@id'],
        )?.slug,
      },
    })),
  };
}

function levenshteinSort(query: string, results: Combined['results']) {
  function getDistance(a: string, b: string) {
    /**
     * On Google Knowledge Graph, if you search for `birdman`, you'd get a bunch
     * of irrelevant results at the top and the one with the name `birdman`
     * would be buried below.
     *
     * We want `birdman` to be up. So we go through each result and match the
     * name of the celeb with the name the user searches for. If they're close,
     * we rank the result item higher.
     *
     * We substring from the beginning because if we didn't then in searches
     * like `michael`, a celeb with just the name `michael` would rank higher
     * than `michael jackson` but with the substring `michael jackson` would
     * also be treated as just `michael`.
     *
     * We substring from the end as well because when a user searches for
     * `jackson`, `michael jackson` would be a poor match.
     *
     * We return the better match after getting both distances.
     */
    const head = levenshtein.get(a, b.substring(0, a.length), {
      useCollator: true,
    });

    const tail = levenshtein.get(a, b.substring(b.length - a.length), {
      useCollator: true,
    });

    return head <= tail ? head : tail;
  }

  results.sort((a, b) => {
    const aDistance = getDistance(query, a.result.name);
    const bDistance = getDistance(query, b.result.name);

    if (aDistance > bDistance) {
      return 1;
    }

    if (aDistance < bDistance) {
      return -1;
    }

    return 0;
  });

  return results;
}

function isPorno(kgResult: Combined['results'][0]) {
  return kgResult.result?.description?.toLowerCase().includes('porno');
}

function availabilitySort(results: Combined['results']) {
  results.sort((a, b) => {
    if (a.result.slug && !b.result.slug) {
      return -1;
    }

    // Nothing against the porn industry. It's just very distracting.
    if (isPorno(a) && !isPorno(b)) {
      return 1;
    }

    if (isPorno(b) && !isPorno(a)) {
      return -1;
    }

    if (b.result.slug && !a.result.slug) {
      return 1;
    }

    return 0;
  });

  return results;
}

export async function fetchResults(query: string) {
  const kgResults = await knowledgeGraphClient({ query });
  const cleanedKgResults = clean(kgResults);
  const hvResults = await hvSearch(cleanedKgResults);
  const { hasHvResults, results: combinedResults } = combine(
    cleanedKgResults,
    hvResults,
  );
  const levenshteinSorted = levenshteinSort(query, combinedResults);
  const availabilitySorted = availabilitySort(levenshteinSorted);

  return { results: availabilitySorted, hasHvResults };
}
