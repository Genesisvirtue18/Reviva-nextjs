import { page } from './page';
import { siteSettings } from './siteSettings';
import { enquiry } from './enquiry';
import { imageAsset } from './imageAsset';
import { landingPage } from './landingPage';
import { redirect } from './redirect';
import { imageItem, inlineHtml, pageSection, richLine, textItem } from './pageFields';
import { post } from './post';
import { blockTypes } from './blocks';

export const schemaTypes = [page, post, siteSettings, enquiry, imageAsset, landingPage, redirect, inlineHtml, richLine, textItem, imageItem, pageSection, ...blockTypes];
