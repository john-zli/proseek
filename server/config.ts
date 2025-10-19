import { addAlias } from 'module-alias';

// Configure moduleAlias
if (__filename.endsWith('js')) {
  addAlias('@server', __dirname + '/dist');
}
