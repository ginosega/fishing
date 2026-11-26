import archived from '../contracts/schema.json' with {type:'json'};
import normalized from '../contracts/v3-schema.json' with {type:'json'};
import {NORMALIZED_V3} from './taxonomy.mjs';
export const schema=NORMALIZED_V3?normalized:archived;
