import { page } from './page';
import { post } from './post';
import { siteSettings } from './siteSettings';
import { enquiry } from './enquiry';
import { redirect } from './redirect';
import { blockTypes } from './blocks';
import { landingTypes } from './landing';

export const schemaTypes = [page, post, siteSettings, enquiry, redirect, ...blockTypes, ...landingTypes];
