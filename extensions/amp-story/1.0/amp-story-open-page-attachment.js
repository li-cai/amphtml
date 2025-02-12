import * as Preact from '#core/dom/jsx';
/**
 * @fileoverview Helper for amp-story rendering of page-attachment UI.
 */
import {AttachmentTheme} from './amp-story-page-attachment';
import {LocalizedStringId} from '#service/localization/strings';
import {computedStyle, setImportantStyles} from '#core/dom/style';
import {dev} from '#utils/log';
import {localize} from './amp-story-localization-service';
import {
  getRGBFromCssColorValue,
  getTextColorForRGB,
  maybeMakeProxyUrl,
} from './utils';
import {htmlRefs} from '#core/dom/static-template';
import {getWin} from '#core/window';

/**
 * @enum {string}
 */
const CtaAccentElement = {
  TEXT: 'text',
  BACKGROUND: 'background',
};

/**
 * For amp-story-page-attachment elements.
 * @return {!Element}
 */
export const renderInlineElement = () => (
  <a
    class="i-amphtml-story-page-open-attachment i-amphtml-story-system-reset"
    role="button"
  >
    <div class="i-amphtml-story-inline-page-attachment-chip" ref="chipEl">
      <div class="i-amphtml-story-inline-page-attachment-arrow"></div>
    </div>
  </a>
);

/**
 * UI template for amp-story-page-outlink elements and
 * the legacy amp-story-page-attachment with href.
 * @return {!Element}
 */
const renderOutlinkElement = () => (
  <a class="i-amphtml-story-page-open-attachment" role="button" target="_top">
    <svg
      class="i-amphtml-story-outlink-page-attachment-arrow"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 8"
      width="20px"
      height="8px"
    >
      <path d="M18,7.7c-0.2,0-0.5-0.1-0.7-0.2l-7.3-4l-7.3,4C2,7.9,1.1,7.7,0.7,6.9c-0.4-0.7-0.1-1.6,0.6-2l8-4.4c0.5-0.2,1-0.2,1.5,0l8,4.4c0.7,0.4,1,1.3,0.6,2C19,7.4,18.5,7.7,18,7.7z"></path>
    </svg>
    <div
      class="i-amphtml-story-outlink-page-attachment-outlink-chip"
      ref="chipEl"
    >
      <span
        class="i-amphtml-story-page-attachment-label"
        ref="ctaLabelEl"
      ></span>
    </div>
  </a>
);

/**
 * Link icon used in amp-story-page-outlink UI and drawer.
 * @return {!Element}
 */
export const renderOutlinkLinkIconElement = () => (
  <svg
    class="i-amphtml-story-page-open-attachment-link-icon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
  >
    <path
      fill-opacity=".1"
      d="M12 0c6.6 0 12 5.4 12 12s-5.4 12-12 12S0 18.6 0 12 5.4 0 12 0z"
    ></path>
    <path d="M13.8 14.6c.1.1.2.3.2.5s-.1.3-.2.5L12.3 17c-.7.7-1.7 1.1-2.7 1.1-1 0-1.9-.4-2.7-1.1-.7-.7-1.1-1.7-1.1-2.7 0-1 .4-1.9 1.1-2.7l1.5-1.5c.2 0 .3-.1.5-.1s.3.1.5.2c.1.1.2.3.2.5s-.1.4-.2.5l-1.5 1.5c-.5.5-.7 1.1-.7 1.7 0 .6.3 1.3.7 1.7.5.5 1.1.7 1.7.7s1.3-.3 1.7-.7l1.5-1.5c.3-.3.7-.3 1 0zM17 7c-.7-.7-1.7-1.1-2.7-1.1-1 0-1.9.4-2.7 1.1l-1.5 1.5c0 .1-.1.3-.1.4 0 .2.1.3.2.5.1.1.3.2.5.2s.3-.1.5-.2l1.5-1.5c.5-.5 1.1-.7 1.7-.7.6 0 1.3.3 1.7.7.5.5.7 1.1.7 1.7 0 .6-.3 1.3-.7 1.7l-1.5 1.5c-.1.1-.2.3-.2.5s.1.3.2.5c.1.1.3.2.5.2s.3-.1.5-.2l1.5-1.5c.7-.7 1.1-1.7 1.1-2.7-.1-1-.5-1.9-1.2-2.6zm-7.9 7.2c0 .2.1.3.2.5.1.1.3.2.5.2s.4-.1.5-.2l4.5-4.5c.1-.1.2-.3.2-.5s-.1-.4-.2-.5c-.3-.2-.8-.2-1 .1l-4.5 4.5c-.1.1-.2.3-.2.4z"></path>
  </svg>
);

/**
 * Determines which open attachment UI to render.
 * @param {!Element} pageEl
 * @param {!Element} attachmentEl
 * @return {!Element}
 */
export const renderPageAttachmentUI = (pageEl, attachmentEl) => {
  // Outlinks can be an amp-story-page-outlink or the legacy version,
  // an amp-story-page-attachment with an href.
  const isOutlink =
    attachmentEl.tagName === 'AMP-STORY-PAGE-OUTLINK' ||
    attachmentEl.getAttribute('href');
  if (isOutlink) {
    return renderOutlinkUI(pageEl, attachmentEl);
  } else {
    return renderInlineUi(pageEl, attachmentEl);
  }
};

/**
 * Renders inline page attachment UI.
 * @param {!Element} pageEl
 * @param {!Element} attachmentEl
 * @return {!Element}
 */
const renderOutlinkUI = (pageEl, attachmentEl) => {
  const openAttachmentEl = renderOutlinkElement();

  // amp-story-page-outlink requires an anchor element child for SEO and analytics optimisations.
  // amp-story-page-attachment uses this same codepath and allows an href attribute.
  // This is hidden with css. Clicks are simulated from it when a remote attachment is clicked.
  const anchorChild = pageEl
    .querySelector('amp-story-page-outlink')
    ?.querySelector('a');

  // Copy href to the element so it can be previewed on hover and long press.
  const attachmentHref =
    anchorChild?.getAttribute('href') || attachmentEl.getAttribute('href');
  if (attachmentHref) {
    openAttachmentEl.setAttribute('href', attachmentHref);
  }

  // Copy title to the element if it exists.
  const attachmentTitle =
    anchorChild?.getAttribute('title') ||
    attachmentEl.getAttribute('data-title');
  if (attachmentTitle) {
    openAttachmentEl.setAttribute('title', attachmentTitle);
  }

  // Get elements.
  const {chipEl, ctaLabelEl} = htmlRefs(openAttachmentEl);

  // Set theme.
  let themeAttribute = attachmentEl.getAttribute('theme');
  if (themeAttribute) {
    themeAttribute = themeAttribute.toLowerCase();
  }
  openAttachmentEl.setAttribute('theme', themeAttribute);

  if (themeAttribute === AttachmentTheme.CUSTOM) {
    setCustomThemeStyles(attachmentEl, openAttachmentEl);
  }

  // Append text & aria-label.
  const openLabelAttr =
    anchorChild?.textContent ||
    attachmentEl.getAttribute('cta-text') ||
    attachmentEl.getAttribute('data-cta-text');
  const openLabel = openLabelAttr
    ? openLabelAttr.trim()
    : localize(pageEl, LocalizedStringId.AMP_STORY_PAGE_ATTACHMENT_OPEN_LABEL);
  ctaLabelEl.textContent = openLabel;
  openAttachmentEl.setAttribute('aria-label', openLabel);

  // Set image.
  const openImgAttr = attachmentEl.getAttribute('cta-image');
  if (openImgAttr && openImgAttr !== 'none') {
    const ctaImgEl = (
      <div class="i-amphtml-story-outlink-page-attachment-img"></div>
    );
    setImportantStyles(ctaImgEl, {
      'background-image': 'url(' + openImgAttr + ')',
    });
    chipEl.prepend(ctaImgEl);
  } else if (!openImgAttr) {
    // Attach link icon SVG by default.
    const linkImage = renderOutlinkLinkIconElement();
    chipEl.prepend(linkImage);
  }

  return openAttachmentEl;
};

/**
 * Renders inline page attachment UI.
 * @param {!Element} pageEl
 * @param {!Element} attachmentEl
 * @return {!Element}
 */
const renderInlineUi = (pageEl, attachmentEl) => {
  const openAttachmentEl = renderInlineElement();

  // Set theme.
  const theme = attachmentEl.getAttribute('theme');
  if (theme && AttachmentTheme.DARK === theme.toLowerCase()) {
    openAttachmentEl.setAttribute('theme', AttachmentTheme.DARK);
  }

  // Append text & aria-label if defined.
  const openLabelAttr =
    attachmentEl.getAttribute('cta-text') ||
    attachmentEl.getAttribute('data-cta-text');
  const openLabel =
    (openLabelAttr && openLabelAttr.trim()) ||
    localize(pageEl, LocalizedStringId.AMP_STORY_PAGE_ATTACHMENT_OPEN_LABEL);
  openAttachmentEl.setAttribute('aria-label', openLabel);

  if (openLabel !== 'none') {
    const textEl = <span class="i-amphtml-story-page-attachment-label"></span>;
    textEl.textContent = openLabel;
    openAttachmentEl.appendChild(textEl);
  }

  // Add images if they are defined.
  const {chipEl} = htmlRefs(openAttachmentEl);
  const makeImgElWithBG = (openImgAttr) => {
    const ctaImgEl = (
      <div class="i-amphtml-story-inline-page-attachment-img"></div>
    );
    setImportantStyles(ctaImgEl, {
      'background-image': 'url(' + openImgAttr + ')',
    });
    return ctaImgEl;
  };

  const openImgAttr2 = attachmentEl.getAttribute('cta-image-2');
  if (openImgAttr2) {
    const src = maybeMakeProxyUrl(openImgAttr2, pageEl.getAmpDoc());
    chipEl.prepend(makeImgElWithBG(src));
  }

  const openImgAttr = attachmentEl.getAttribute('cta-image');
  if (openImgAttr) {
    const src = maybeMakeProxyUrl(openImgAttr, pageEl.getAmpDoc());
    chipEl.prepend(makeImgElWithBG(src));
  }

  return openAttachmentEl;
};

/**
 * Sets custom theme attributes.
 * @param {!Element} attachmentEl
 * @param {!Element} openAttachmentEl
 */
export const setCustomThemeStyles = (attachmentEl, openAttachmentEl) => {
  if (!attachmentEl.hasAttribute('cta-accent-color')) {
    dev().warn(
      'AMP-STORY-PAGE-OUTLINK',
      'No cta-accent-color attribute found.'
    );
  }

  const accentColor =
    attachmentEl.getAttribute('cta-accent-color') || '#000000';

  // Calculating contrast color (black or white) needed for outlink CTA UI.
  let contrastColor = null;
  setImportantStyles(attachmentEl, {
    'background-color': accentColor,
  });

  const win = getWin(attachmentEl);
  const styles = computedStyle(win, attachmentEl);
  const rgb = getRGBFromCssColorValue(styles['background-color']);
  contrastColor = getTextColorForRGB(rgb);
  setImportantStyles(attachmentEl, {
    'background-color': '',
  });
  if (
    attachmentEl.getAttribute('cta-accent-element') ===
    CtaAccentElement.BACKGROUND
  ) {
    setImportantStyles(openAttachmentEl, {
      '--i-amphtml-outlink-cta-background-color': accentColor,
      '--i-amphtml-outlink-cta-text-color': contrastColor,
    });
    setImportantStyles(attachmentEl, {
      '--i-amphtml-outlink-cta-background-color': accentColor,
      '--i-amphtml-outlink-cta-text-color': contrastColor,
    });
  } else {
    setImportantStyles(openAttachmentEl, {
      '--i-amphtml-outlink-cta-background-color': contrastColor,
      '--i-amphtml-outlink-cta-text-color': accentColor,
    });
    setImportantStyles(attachmentEl, {
      '--i-amphtml-outlink-cta-background-color': contrastColor,
      '--i-amphtml-outlink-cta-text-color': accentColor,
    });
  }
};
