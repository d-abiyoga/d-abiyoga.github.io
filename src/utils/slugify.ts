import { slug as slugger } from "github-slugger";

export const slugify = (str: string) => slugger(str);

export default slugify;
