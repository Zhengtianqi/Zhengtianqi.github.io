---
title: ElasticSearch客户端
author: ztq
tag:
  - es
category:
  - 大数据
  
date: 2020-07-15 11:10:00
---

以下为springboot整合elasticsearch

es版本为7.2.1

# 1、先引入es的依赖

```java
  <!-- ES  -->
        <dependency>
            <groupId>org.elasticsearch.client</groupId>
            <artifactId>elasticsearch-rest-high-level-client</artifactId>
            <version>7.2.1</version>
        </dependency>
        <dependency>
            <groupId>org.elasticsearch</groupId>
            <artifactId>elasticsearch</artifactId>
            <version>7.2.1</version>
        </dependency>
        <dependency>
            <groupId>org.elasticsearch.client</groupId>
            <artifactId>elasticsearch-rest-client-sniffer</artifactId>
            <version>7.2.1</version>
        </dependency>
```

# 2、编写工具类

EsRestHighLevelClient.java

```java
package com.example.utils;

import com.example.constant.Constants;
import org.apache.http.HttpHost;
import org.elasticsearch.action.search.SearchRequest;
import org.elasticsearch.action.search.SearchResponse;
import org.elasticsearch.client.RequestOptions;
import org.elasticsearch.client.RestClient;
import org.elasticsearch.client.RestClientBuilder;
import org.elasticsearch.client.RestHighLevelClient;
import org.elasticsearch.client.sniff.SniffOnFailureListener;
import org.elasticsearch.index.query.BoolQueryBuilder;
import org.elasticsearch.index.query.QueryBuilders;
import org.elasticsearch.search.builder.SearchSourceBuilder;

import java.io.IOException;
import java.util.Optional;
import java.util.logging.Logger;

/**
 * es连接客户端
 *
 * @author zhengtianqi
 */
public class EsRestHighLevelClient {

    public static Logger log = Logger.getLogger(EsRestHighLevelClient.class.toString());

    private EsRestHighLevelClient() {
    }

    /**
     * 返回单例的Client(ES)
     */
    public static RestHighLevelClient getEsClient() {
        return InternalClass.client;
    }

    private static class InternalClass {
        private static RestHighLevelClient client;

        static {
            try {
                String ip = Constants.ES_HTTP_PORT;
                String[] ips = ip.split(Constants.COMMA_SPLIT);

                HttpHost[] httpHosts = new HttpHost[ips.length];
                for (int i = 0; i < ips.length; i++) {
                    httpHosts[i] = new HttpHost(ips[i], 9200, "http");
                }

                SniffOnFailureListener sniffOnFailureListener = new SniffOnFailureListener();
                RestClientBuilder restClientBuilder = RestClient.builder(httpHosts).setFailureListener(sniffOnFailureListener).setHttpClientConfigCallback(httpClientBuilder -> {
                    //最大连接数
                    httpClientBuilder.setMaxConnTotal(100);
                    httpClientBuilder.setMaxConnPerRoute(50);
                    return httpClientBuilder;
                }).setRequestConfigCallback(requestConfigBuilder -> {
                    // 超时设置
                    requestConfigBuilder.setConnectTimeout(2000).setConnectionRequestTimeout(2000);
                    return requestConfigBuilder;
                });

                client = Optional.of(restClientBuilder).map(RestHighLevelClient::new).orElse(null);

            } catch (Exception e) {
                log.severe("初始化RestHighLevelClient时出错!");
            }
            if (null == client) {
                log.severe("创建ES连接失败!");
            }
        }
    }


    /**
     * 测试类
     *
     * @param args main方法参数
     * @throws IOException 抛出异常 无需处理
     */
    public static void main(String[] args) throws IOException {
        RestHighLevelClient esClient = EsRestHighLevelClient.getEsClient();

        BoolQueryBuilder query = QueryBuilders.boolQuery();
        SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder().query(query).size(10);
        SearchRequest searchRequest = new SearchRequest(Constants.INDEX_PERSON).source(searchSourceBuilder);
        SearchResponse search = esClient.search(searchRequest, RequestOptions.DEFAULT);
        System.out.println(search);
        esClient = getEsClient();
        search = esClient.search(searchRequest, RequestOptions.DEFAULT);
        System.out.println(search);
    }
}

```

# 3、查询（简单举例）

```java
    /**
     * 查询
     *
     * @return 返回SearchHit 篮子对象
     */
    public SearchHit[] listPerson(String name) {
        try {
            SearchRequest searchRequest = new SearchRequest("person");
            SearchSourceBuilder sourceBuilder = new SearchSourceBuilder();
            BoolQueryBuilder boolQueryBuilder = QueryBuilders.boolQuery();
            if (null != name && !"".equals(name)) {
                boolQueryBuilder.must(QueryBuilders.matchQuery("name", name));
            }
            sourceBuilder.query(boolQueryBuilder);
            searchRequest.source(sourceBuilder);
            SearchResponse searchResponse = client.search(searchRequest, RequestOptions.DEFAULT);
            SearchHit[] hs = searchResponse.getHits().getHits();
            return hs;
        } catch (Exception e) {
            log.warning("查询信息时异常，查询es失败");
            return null;
        }
    }
```

# 4、插入或更新（简单举例）

```java
 try {
            BulkRequest bulkRequest = new BulkRequest();
            Map<String, Object> jsonMap = new HashMap<>(1);
            jsonMap.put("id", person.getId());
            jsonMap.put("name", person.getName());
            jsonMap.put("age", person.getAge());
            jsonMap.put("isNeighbourhood", person.getIsNeighbourhood());

            IndexRequest indexRequest = new IndexRequest("person")
                    .id(String.valueOf(person.getId())).source(jsonMap);
            bulkRequest.add(indexRequest);
            BulkResponse bulk = client.bulk(bulkRequest, RequestOptions.DEFAULT);
            log.warning("数据库写入/更新 ES成功");
        } catch (IOException e) {
            log.warning("数据写入/更新 ES发生IO异常!");
        } catch (Throwable e) {
            log.warning("数据写入/更新 ES发生异常!");
        }
```

# 5、删除（简单举例）

```java
        DeleteRequest deleteRequest = new DeleteRequest("person", String.valueOf(person.getId()));
        try {
            DeleteResponse deleteResponse = client.delete(deleteRequest, RequestOptions.DEFAULT);
            log.info("删除" + deleteResponse.getId() + ", 状态为:" + deleteResponse.status());
        } catch (IOException e) {
            log.warning("ES删除数据发生IO异常!");
        }
```

# 6、遍历篮子（简单举例）

```java
    @Override
    public List<Person> listPerson(String name) {
        SearchHit[] hs = personDao.listPerson(name);
        List<Person> personList = new ArrayList<>(64);
        for (SearchHit searchHit : hs) {
            Map<String, Object> hitMap = searchHit.getSourceAsMap();
            Person person = new Person();
            person.setId((Integer) hitMap.get("id"));
            person.setName((String) hitMap.get("name"));
            person.setAge((Integer) hitMap.get("age"));
            person.setIsNeighbourhood((String) hitMap.get("isNeighbourhood"));
            personList.add(person);
        }
        return personList;
    }
```

