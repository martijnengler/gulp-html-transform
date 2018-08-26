import { Transformer } from '../../transform'

export interface InputOptions {
  /**
   * Array with numbers for each width to generate srcset for
   *
   * a `1` means to generate the original width
   *
   * Example: `[1, 720, 360]`
   */
  width?: number[]
  /**
   * Array with strings for each image format to generate srcset for
   *
   * Example: `['webp', 'jpg']`
   */
  format?: string[]
  /**
   * Prefix to add to the image url, before the size
   *
   * Default: `'@'`
   *
   * The format of the generated string is `${filename}${prefix}${width}${postfix}`
   */
  prefix?: string
  /**
   * Postfix to add to the image url, after the size
   *
   * Default: `'w'`
   *
   * The format of the generated string is `${filename}${prefix}${width}${postfix}`
   */
  postfix?: string
}

interface Options {
  sizes: number[]
  format: string[]
  prefix: string
  postfix: string
}
const defaultOptions: Options = {
  sizes: [],
  format: [],
  prefix: '@',
  postfix: 'w',
}

export const htmlSrcset = (inputOptions: InputOptions = {}): Transformer => {
  if (inputOptions.width) {
    (inputOptions as Options).sizes = inputOptions.width
  }

  const options: Options = Object.assign(defaultOptions, inputOptions)

  if (options.sizes.length === 0 || options.format.length === 0) {
    throw new Error('No widths or formats supplied')
  }

  return async ($: CheerioStatic) => {
    $('img[src]').each((i, el) => {
      const $el = $(el)
      let origSize: number | string
      let origSrc: string

			origSrc = $(el).attr('src');
			var sizeOf = require('image-size');
			var dimensions = sizeOf('public/' + origSrc);
			origSize = dimensions.width;
			// dir should be either 'w' or 'h'
			// we can hardcode for 'w' now
			let dir = 'w';

      let filename = (() => {
        let x = origSrc.split('.')
        x.pop()
        return x.join('.')
      })()

      let origext = origSrc.split('.').slice(-1)[0];
      const sizes: number[] = []

      options.sizes.forEach(size => {
        if (origSize > size) {
          sizes.push(size)
        }
      })

      let srcset: string[] = []

      var source_html = '';
			options.format.forEach(ext => {
				source_html += '<source ';
				if(ext != origext)
				{
					source_html += 'type="image/' + ext + '"';
				}
				sizes.forEach(size => {
          if (size === 1) {
            srcset.push(`${filename}.${ext} ${origSize}${dir}`)
          } else {
            srcset.push(`${filename}${options.prefix}${size}${options.postfix}.${ext} ${size}${dir}`)
          }
        })
        source_html += ' srcset="' + srcset.join(', ') + '"';
        source_html += '/>';
        srcset = [];
      })

      $el.attr('src', origSrc)

      // I'd rather use something like `$el.appendTo(el_picture)`
      // to move the <img> inside of the <picture>, but I can't
      // get it to work in Cheerio :(
      var el_picture_html = "<picture>" + source_html;
      el_picture_html += $.html(el);
      el_picture_html += "</picture>";
      var el_picture = $.parseHTML(el_picture_html);
      $el.after(el_picture);
      $el.remove();
    })
  }
}

export default htmlSrcset
