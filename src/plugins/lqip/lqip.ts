const chalk = require('chalk')
import * as path from 'path'
import * as fs from 'fs'
import { promisify } from 'util'

import { Transformer } from '../../transform'
import { styles } from './lqip.css'

export interface LqipOptions {
  base: string
  query?: string
  addStyles?: boolean
}

export const lqip = (options: LqipOptions): Transformer => {
  let base64: any
  let sizeOf: any
  try {
    base64 = require('lqip').base64
    sizeOf = promisify(require('image-size'))
  } catch (err) {
    console.warn(`lqip requires ${chalk.red('lqip')} and ${chalk.red('image-size')} to be installed`)
    return async () => {
      // noop
    }
  }
  if (!options.base) {
    throw new Error('Missing required parameter `base` from options')
  }

  options = Object.assign({
    query: 'img[src]',
  }, options)

  return async ($: CheerioStatic) => {
    const promises: Promise<void>[] = []

    if (options.addStyles) {
      $('head').append(`<style>${styles}</style>`)
    }

    const elements = $(options.query).toArray().map(el => $(el))

    for (const $el of elements) {
      const filepath = path.join(options.base, $el.attr('src'))

      const p = Promise.all([
        base64(filepath),
        sizeOf(filepath),
      ]).then(([res, dimensions]) => {
        const wrapper = $('<div />')
        wrapper.css('padding-top', ((dimensions.height / dimensions.width) * 100).toFixed(4) + '%')
        wrapper.css('background-image', `url(${res})`)
        wrapper.attr('class', `lqip blur ${$el.attr('class')}`)
        const clone = $el.clone()
        clone.attr('onload', 'this.parentElement.classList.remove(\'blur\')')
        clone.attr('class', '')
        wrapper.append(clone)
        $el.replaceWith(wrapper)
      }, () => {
        // noop
      })
      promises.push(p)
    }

    await Promise.all(promises)
  }
}
