import 'i18next';
import type Resources from './generated/resources.js';

declare module 'i18next' {
	interface CustomTypeOptions {
		defaultNS: 'errors';
		resources: Resources;
	}
}
