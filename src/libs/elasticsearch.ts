import { Client } from '@elastic/elasticsearch';

export const elasticsearch = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    // username: process.env.ELASTICSEARCH_USERNAME ?? 'elastic',
    // password: process.env.ELASTICSEARCH_PASSWORD ?? 'elastic_dev_password',
    apiKey: process.env.ELASTICSEARCH_API_KEY as string,
  },
});