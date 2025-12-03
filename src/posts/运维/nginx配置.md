---
title: nginx配置
author: zheng
tag:
  - nginx
category:
  - CICD
date: 2022-09-14 11:48:00
---
# 一、负载均衡策略
负载均衡用于从“upstream”模块定义的后端服务器列表中选取一台服务器接受用户的请求。一个最基本的upstream模块是这样的，模块内的server是服务器列表：
```java
#动态服务器组
upstream dynamic_zuoyu {
    server localhost:8080;  #tomcat1
    server localhost:8081;  #tomcat2
    server localhost:8082;  #tomcat3
    server localhost:8083;  #tomcat4
}
```
在upstream模块配置完成后，要让指定的访问反向代理到服务器列表：
```java
#其他页面反向代理到tomcat容器
location ~ .*$ {
    index index.jsp index.html;
    proxy_pass http://dynamic_zuoyu;
}
```
这就是最基本的负载均衡实例，但这不足以满足实际需求；目前Nginx服务器的upstream模块支持6种方式的分配：
负载均衡策略
![img_1.png](/assets/images/img_nginx.png)
在这里，只详细说明Nginx自带的负载均衡策略，第三方不多描述。
## 1、轮询
最基本的配置方法，上面的例子就是轮询的方式，它是upstream模块默认的负载均衡默认策略。每个请求会按时间顺序逐一分配到不同的后端服务器。
　有如下参数：
![img.png](/assets/images/img_nginx2.png)
注意：
- 在轮询中，如果服务器down掉了，会自动剔除该服务器。
- 缺省配置就是轮询策略。
- 此策略适合服务器配置相当，无状态且短平快的服务使用。
## 2、weight
权重方式，在轮询策略的基础上指定轮询的几率。例子如下：
```java
 upstream dynamic_zuoyu {
        server localhost:8080   weight=2;  #tomcat 1
        server localhost:8081;  #tomcat 2
        server localhost:8082   backup;  #tomcat 3
        server localhost:8083   max_fails=3 fail_timeout=20s;  #tomcat 4
    }
```
在该例子中，weight参数用于指定轮询几率，weight的默认值为1,；weight的数值与访问比率成正比，比如Tomcat 7.0被访问的几率为其他服务器的两倍。
注意：
- 权重越高分配到需要处理的请求越多。
- 此策略可以与least_conn和ip_hash结合使用。
- 此策略比较适合服务器的硬件配置差别比较大的情况。

## 3、ip_hash
指定负载均衡器按照基于客户端IP的分配方式，这个方法确保了相同的客户端的请求一直发送到相同的服务器，以保证session会话。这样每个访客都固定访问一个后端服务器，可以解决session不能跨服务器的问题。
```java
#动态服务器组
    upstream dynamic_zuoyu {
        ip_hash;    #保证每个访客固定访问一个后端服务器
        server localhost:8080   weight=2;  #tomcat 1
        server localhost:8081;  #tomcat 2
        server localhost:8082;  #tomcat 3
        server localhost:8083   max_fails=3 fail_timeout=20s;  #tomcat 4
    }
```
注意：
- 在nginx版本1.3.1之前，不能在ip_hash中使用权重（weight）。
- ip_hash不能与backup同时使用。
- 此策略适合有状态服务，比如session。
- 当有服务器需要剔除，必须手动down掉。
## 4、least_conn
把请求转发给连接数较少的后端服务器。轮询算法是把请求平均的转发给各个后端，使它们的负载大致相同；但是，有些请求占用的时间很长，会导致其所在的后端负载较高。这种情况下，least_conn这种方式就可以达到更好的负载均衡效果。
```java
#动态服务器组
upstream dynamic_zuoyu {
    least_conn;    #把请求转发给连接数较少的后端服务器
    server localhost:8080   weight=2;  #tomcat 1
    server localhost:8081;  #tomcat 2
    server localhost:8082 backup;  #tomcat 3
    server localhost:8083   max_fails=3 fail_timeout=20s;  #tomcat 4
}
```
## 5、第三方策略
### （1）fair
按照服务器端的响应时间来分配请求，响应时间短的优先分配。
```java
# 动态服务器组
upstream dynamic_zuoyu {
        server localhost:8080;  #tomcat 1
        server localhost:8081;  #tomcat 2
        server localhost:8082;  #tomcat 3
        server localhost:8083;  #tomcat 4
        fair;    #实现响应时间短的优先分配
}
```
### （2）url_hash
按访问url的hash结果来分配请求，使每个url定向到同一个后端服务器，要配合缓存命中来使用。
同一个资源多次请求，可能会到达不同的服务器上，导致不必要的多次下载，缓存命中率不高，以及一些资源时间的浪费。
而使用url_hash，可以使得同一个url（也就是同一个资源请求）会到达同一台服务器，一旦缓存住了资源，再此收到请求，就可以从缓存中读取。　
```java
#动态服务器组
upstream dynamic_zuoyu {
    hash $request_uri;    #实现每个url定向到同一个后端服务器
    server localhost:8080;  #tomcat 1
    server localhost:8081;  #tomcat 2
    server localhost:8082;  #tomcat 3
    server localhost:8083;  #tomcat 4
}
```
# 二、nginx匹配规则
nginx.conf主要由三部分组成：全局块， events块， http块，详细如下：

- 1、全局块：配置影响nginx全局的指令。一般有运行nginx服务器的用户组，nginx进程pid存放路径，日志存放路径，配置文件引入，允许生成worker process数等。
- 2、events块：配置影响nginx服务器或与用户的网络连接。有每个进程的最大连接数，选取哪种事件驱动模型处理连接请求，是否允许同时接受多个网路连接，开启多个网络连接序列化等。
- 3、http块：可以嵌套多个server，配置代理，缓存，日志定义等绝大多数功能和第三方模块的配置。如文件引入，mime-type定义，日志自定义，是否使用sendfile传输文件，连接超时时间，单连接请求数等。
- 4、server块：配置虚拟主机的相关参数，一个http中可以有多个server。
- 5、location块：配置请求的路由，以及各种页面的处理情况。
## （1）语法
```java
location [=|~|~*|^~] /uri/ { … }
location = /uri    = 表示精确匹配，只有完全匹配上才能生效
location ^~ /uri    ^~ 开头对URL路径进行前缀匹配，并且在正则之前。
location ~ pattern    开头表示区分大小写的正则匹配
location ~* pattern    开头表示不区分大小写的正则匹配
location /uri    不带任何修饰符，也表示前缀匹配，但是在正则匹配之后
location /    通用匹配，任何未匹配到其它location的请求都会匹配到，相当于switch中的default
```
优先级：(location =) > (location 完整路径) > (location ^~ 路径) > (location ~,~* 正则顺序) > (location 部分起始路径) > (/)
前缀匹配时，Nginx 不对 url 做编码，因此请求为 /static/20%/aa，可以被规则 ^~ /static/ /aa 匹配到（注意是空格）
## （2）规则
一个请求过来后，Nginx匹配这个请求的流程如下：
- 1> 先查找是否有=开头的精确匹配，
```java
如：location = /test/abc/user.do { … }
```
- 2> 再查找普通匹配，以 最大前缀 为原则，如有以下两个location，则会匹配后一项
```java
  location /test/ { … }
  location /test/abc { … }
```
- 3> 匹配到一个普通格式后，搜索并未结束，而是暂存当前匹配的结果，并继续搜索正则匹配模式
- 4> 所有正则匹配模式location中找到第一个匹配项后，就以此项为最终匹配结果
所以正则匹配项匹配规则，受定义的前后顺序影响，但普通匹配模式不会
- 5> 如果未找到正则匹配项，则以3中缓存的结果为最终匹配结果
- 6> 如果一个匹配都没搜索到，则返回404
注：精确匹配与模糊匹配差别：
```java
  location =/ { … } 与 location / { … } 的差别：
```
- 前一个是精确匹配，只响应/请求，所有/xxx或/xxx/xxxx类的请求都不会以前缀的形式匹配到它
- 后一个是只要以 / 为前缀的请求都会被匹配到。如：/abc ， /test/abc， /test/abc/aaaa
示例1
```java
server {
	listen 80;
	server_name x.x.x.x;
	......
	location /subdir {
		proxy_pass http://y.y.y.y;   ###注意这里没有以/结尾
	}
}
# 那么用户请求http://x.x.x.x/subdir/other时，匹配到该区块，nginx反代会保留虚拟路径
# nginx实际转发后端的请求URL为http://http://y.y.y.y/subdir/other
```
示例2
```java
server {
	listen 80;
	server_name x.x.x.x;
	......
	location /subdir {
		proxy_pass http://y.y.y.y/;   ##注意这里以/结尾
	}
}
# 那么用户请求http://x.x.x.x/subdir/other时，匹配到该区块，nginx反代不会保留虚拟路径，
# nginx实际转发后端的请求URL为http://http://y.y.y.y//other
```
# 二、rewrite重写
## rewrite使用场景：
- 地址跳转，用户访问www.nginx01.com这个URL时，将其定向至一个新的域名www.nginx02.com
- 协议跳转，将用户通过http的请求协议重新跳转至https协议(实现https主要手段)。
- URL静态化，将动态URL地址显示为静态URL的一种技术，能提高搜索引擎抓取 并且能减少动态URL对外暴露过多的参数。PS:Rewrite会轻微增加服务器负担。
## 四种方案
- last 停止处理后续rewrite指令集，跳出location作用域，并开始搜索与更改后的URI相匹配的location，URL地址不变
- break 停止处理后续rewrite指令集，不会跳出location作用域，不再进行重新查找，终止匹配，URL地址不变
- redirect 返回302临时重定向，浏览器地址栏会显示跳转后的URL地址，爬虫不会更新自己的URL数据库
- permanent 返回301永久重定向，浏览器地址栏会显示跳转后的URL地址，爬虫会更新自己的URL数据库
注：使用last和break时浏览器中的地址不会改变，使用redirect和permanent则会改变
# 三、return
## 返回状态码
```java
location /test {    
    set $name 'user123';
    return 404  $name;
}
```
## 返回字符串
```java
location /test {
    return 200 'hello';
}
```
## 地址跳转
```java
location /test {    
    return http://www.baidu.com;
}
```
## 返回自定义变量
```java
set $name 'user123';
return 200 $name;
```
## 返回内置变量
```java
return $uri;
```
## 返回日志信息实例
```java
return  200 '$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent" "$http_x_forwarded_for"';
```

# 四 、常用的全局变量
```java
例：http://www.abc.com:99/aa/bb/test.jsp
$host　　　　　　　　www.abc.com
$server_port　　　　　8080
$request_uri　　　　 /aa/bb/test.jsp
$document_root　　 /pm_code
$request_filename　　/pm_code/aa/bb/test.jsp
```
# 五、root和alias指令
## root
```java
location /i/ {  
    root /data/w3;
}
# 请求 http://test.net/i/picture.jpg 这个地址时，那么在服务器里面对应的真正的资源
# 注意：真实的路径是root指定的值加上location指定的值 。
```
## alias
```java
location /i/ {  
    alias /data/w3/;
}
# 同样请求 http://test.net/i/picture.jpg 时，在服务器查找的资源路径是： /data/w3/picture.jpg
```
区别：
- alias 只能作用在location中，而root可以存在server、http和location中。
- alias 后面必须要用 “/” 结束，否则会找不到文件，而 root 则对 ”/” 可有可无。

# 六、Gzip
将响应报⽂发送⾄客户端之前可以启⽤压缩功能，这能够有效地节约带宽，并提⾼响应⾄客户端的速度。Gzip压缩可以配置http,server和location模块下。
配置如下：
```java
gzip on;                 #决定是否开启gzip模块，on表示开启，off表示关闭；
gzip_min_length 1k;      #设置允许压缩的页面最小字节(从header头的Content-Length中获取) ，当返回内容大于此值时才会使用gzip进行压缩,以K为单位,当值为0时，所有页面都进行压缩。建议大于1k
gzip_buffers 4 16k;      #设置gzip申请内存的大小,其作用是按块大小的倍数申请内存空间,param2:int(k) 后面单位是k。这里设置以16k为单位,按照原始数据大小以16k为单位的4倍申请内存
gzip_http_version 1.1;   #识别http协议的版本,早起浏览器可能不支持gzip自解压,用户会看到乱码
gzip_comp_level 2;       #设置gzip压缩等级，等级越底压缩速度越快文件压缩比越小，反之速度越慢文件压缩比越大；等级1-9，最小的压缩最快 但是消耗cpu
gzip_types text/plain application/x-javascript text/css application/xml;    #设置需要压缩的MIME类型,非设置值不进行压缩，即匹配压缩类型
gzip_vary on;            #启用应答头"Vary: Accept-Encoding"
gzip_proxied off;
nginx做为反向代理时启用,off(关闭所有代理结果的数据的压缩),expired(启用压缩,如果header头中包括"Expires"头信息),no-cache(启用压缩,header头中包含"Cache-Control:no-cache"),
no-store(启用压缩,header头中包含"Cache-Control:no-store"),private(启用压缩,header头中包含"Cache-Control:private"),no_last_modefied(启用压缩,header头中不包含
"Last-Modified"),no_etag(启用压缩,如果header头中不包含"Etag"头信息),auth(启用压缩,如果header头中包含"Authorization"头信息)
gzip_disable msie6;
(IE5.5和IE6 SP1使用msie6参数来禁止gzip压缩 )指定哪些不需要gzip压缩的浏览器(将和User-Agents进行匹配),依赖于PCRE库
```
推荐配置如下：
```java
gzip on;						#开启gzip压缩功能
gzip_min_length 10k;			#设置允许压缩的页面最小字节数; 这里表示如果文件小于10个字节，就不用压缩，因为没有意义，本来就很小.
gzip_buffers 4 16k;			#设置压缩缓冲区大小，此处设置为4个16K内存作为压缩结果流缓存
gzip_http_version 1.1;			#压缩版本
gzip_comp_level 6;			#设置压缩比率，最小为1，处理速度快，传输速度慢；9为最大压缩比，处理速度慢，传输速度快; 这里表示压缩级别，可以是0到9中的任一个，级别越高，压缩就越小，节省了带宽资源，但同时也消耗CPU资源，所以一般折中为6
gzip types text/css text/xml application/javascript;		#制定压缩的类型,线上配置时尽可能配置多的压缩类型!
gzip_disable "MSIE [1-6]\.";		#配置禁用gzip条件，支持正则。此处表示ie6及以下不启用gzip（因为ie低版本不支持）
gzip vary on;					#选择支持vary header；改选项可以让前端的缓存服务器缓存经过gzip压缩的页面; 这个可以不写，表示在传送数据时，给客户端说明我使用了gzip压缩
```

# 七、配置https示例
```java
http {
        include mime.types;
	    #include luawaf.conf;
	    #include proxy.conf;
        default_type  application/octet-stream;
        server_names_hash_bucket_size 512;
        client_header_buffer_size 32k;
        large_client_header_buffers 4 32k;
        client_max_body_size 50m;
        sendfile   on;
        tcp_nopush on;
        keepalive_timeout 60;
        tcp_nodelay on;
        fastcgi_connect_timeout 300;
        fastcgi_send_timeout 300;
        fastcgi_read_timeout 300;
        fastcgi_buffer_size 64k;
        fastcgi_buffers 4 64k;
        fastcgi_busy_buffers_size 128k;
        fastcgi_temp_file_write_size 256k;
		fastcgi_intercept_errors on;

        gzip on;
        gzip_min_length  1k;
        gzip_buffers     4 16k;
        gzip_http_version 1.1;
        gzip_comp_level 2;
        gzip_types     text/plain application/javascript application/x-javascript text/javascript text/css application/xml;
        gzip_vary on;
        gzip_proxied   expired no-cache no-store private auth;
        gzip_disable   "MSIE [1-6]\.";

        limit_conn_zone $binary_remote_addr zone=perip:10m;
		limit_conn_zone $server_name zone=perserver:10m;

        server_tokens off;
        access_log off;
	upstream webservers{
            server  127.0.0.1:8082;
        }
        server {
            #SSL 默认访问端口号为 443
            listen 443 ssl;
            #请填写绑定证书的域名
            server_name www.tianqi.icu; 
            #请填写证书文件的相对路径或绝对路径
            ssl_certificate  /etc/nginx/tianqi.icu_bundle.crt; 
            #请填写私钥文件的相对路径或绝对路径
            ssl_certificate_key /etc/nginx/tianqi.icu.key; 
            ssl_session_timeout 5m;
            #请按照以下套件配置，配置加密套件，写法遵循 openssl 标准。
            ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
            #请按照以下协议配置
            ssl_protocols TLSv1.2 TLSv1.3;
            ssl_prefer_server_ciphers on;
            location / {
                #if ( $host = '152.136.121.33' ) {
		#    return 301 https://zhengtianqi.asia$request_uri;
		#}
                proxy_pass http://webservers;
                proxy_next_upstream http_500 http_504 http_502 error timeout invalid_header;
                # 启用keep alive
                proxy_http_version 1.1;
                proxy_set_header Connection "";
                # 获取 xforward和真实IP
                proxy_set_header  X-Forwarded-For  $proxy_add_x_forwarded_for;
                proxy_set_header  X-Real-IP  $remote_addr;
                proxy_set_header  Host $host;
            }
        }
        server {
                listen 80;
                server_name www.tianqi.icu;
                proxy_next_upstream http_500 http_504 http_502 error timeout invalid_header;
                # 启用keep alive
                proxy_http_version 1.1;
                proxy_set_header Connection "";
                # 获取 xforward和真实IP
                proxy_set_header  X-Forwarded-For  $proxy_add_x_forwarded_for;
                proxy_set_header  X-Real-IP  $remote_addr;
                proxy_set_header  Host $host;
                #把http的域名请求转成https
                #return 301 https://zhengtianqi.asia$request_uri; 
		return 301 https://www.tianqi.icu$request_uri;
        }
        #include /www/server/panel/vhost/nginx/*.conf;
}
```