import type { SpokestackInitConfig } from '../Spokestack'
import { download } from './download'
import map from 'lodash/map'

export default async function getModels(
  config: SpokestackInitConfig,
  onError: (error: string) => void
) {
  let nluFiles: string[] = []
  const nluModelUrls = config.nluModelUrls
  if (
    nluModelUrls &&
    typeof nluModelUrls.nlu === 'string' &&
    typeof nluModelUrls.vocab === 'string' &&
    typeof nluModelUrls.metadata === 'string'
  ) {
    nluFiles =
      (await Promise.all([
        download(
          config.nluModelUrls.nlu,
          { id: 'nlu' },
          {
            forceCellular: true,
            fetchBlobConfig: {
              appendExt: 'tflite',
              overwrite: !!config.refreshModels
            }
          }
        ),
        download(
          config.nluModelUrls.vocab,
          { id: 'vocab' },
          {
            forceCellular: true,
            fetchBlobConfig: {
              appendExt: 'txt',
              overwrite: !!config.refreshModels
            }
          }
        ),
        download(
          config.nluModelUrls.metadata,
          { id: 'metadata' },
          {
            forceCellular: true,
            fetchBlobConfig: {
              appendExt: 'json',
              overwrite: !!config.refreshModels
            }
          }
        )
      ]).catch((error) => {
        const msg = 'Failed to download Spokestack NLU files'
        console.error(msg, error)
        onError(msg)
      })) || []
  } else {
    const error =
      'NLU model URLs not specified (nlu, vocab, and metadata required). An NLU is required to process speech. See https://spokestack.io/docs/Concepts/nlu for details.'
    console.error(error)
    onError(error)
    return
  }

  const wakewordModelUrls = config.wakewordModelUrls
  if (
    !wakewordModelUrls ||
    typeof wakewordModelUrls.filter !== 'string' ||
    typeof wakewordModelUrls.detect !== 'string' ||
    typeof wakewordModelUrls.encode !== 'string'
  ) {
    console.warn(
      'Wakeword model URLs not specified (filter, detect, and encode required). Using "Spokestack" wakeword files.'
    )
    config.wakewordModelUrls = {
      filter:
        'https://d3dmqd7cy685il.cloudfront.net/model/wake/spokestack/filter.tflite',
      detect:
        'https://d3dmqd7cy685il.cloudfront.net/model/wake/spokestack/detect.tflite',
      encode:
        'https://d3dmqd7cy685il.cloudfront.net/model/wake/spokestack/encode.tflite'
    }
  }
  const wakewordFiles =
    (await Promise.all(
      map(config.wakewordModelUrls, (url, name) =>
        download(
          url,
          { id: name },
          {
            forceCellular: true,
            fetchBlobConfig: {
              appendExt: 'tflite',
              overwrite: !!config.refreshModels
            }
          }
        )
      )
    ).catch((error) => {
      const msg = 'Failed to download Spokestack wakeword files'
      console.error(msg, error)
      onError(msg)
    })) || []

  return [nluFiles, wakewordFiles]
}
