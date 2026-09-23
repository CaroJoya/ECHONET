# SmartHomeSimulatorについて

SmartHomeSimulatorはIoT プログラミング研修のために作成されたソフトウエアです。IoT住宅をまねたIoT House Simulatorと、上記Simulatorを制御できるECHONET Lite Web APIで構成されます。IoT House Simulatorはブラウザ上で動作しECHONET Lite Web APIはNode.js上で動作します。ソフトウエアは全てJavaScriptで記述されています。SmartHomeSimulatorを動かすにはNode.jsが必要となります。

<img src="https://github.com/foobarbazfred/SmartHomeSimulator/blob/main/images/screen_iamge.png?raw=true" width=300>

# ソフトウエアのインストール方法

Node.jsが動くLinux環境またはWindows環境において、ソースファイル一式を配置してください(srcフォルダ以下のファイル一式)。gitコマンドを使う場合は以下
```
 git clone https://github.com/foobarbazfred/SmartHomeSimulator.git
```

app.jsやpackage.jsonが置かれているソースフォルダ(src)に移動して、下記のコマンドを実行することで必要なパッケージ類がインストールされます。
```
npm  install
```
上記コマンドを実行することによりnpmコマンドがpackage.jsonを参照し、必要なパッケージ類が自動的にインストールされます。もしバージョン不整合等によるエラーが発生した場合、必要なパッケージ類を手動でインストールすることもできます。必須パッケージは下記の通りです。
- body-parser
- express
- socket.io
- morgan
- ejs
- yargs

手動でインストールする場合、以下の様にパッケージ名を指定してnpmコマンドを実行してください。
```
npm install body-parser
npm install express
npm install socket.io
npm install ejs
npm install yargs
```
（手動インストール時、morganも入れる必要があるのか未確認）

# ソフトウエアの起動方法

app.jsが置かれているソースフォルダ(src)において以下のコマンドを実行することによりソフトウエアが起動されます。
```
node app.js
```
正常に起動されると以下のようにListen IPとPortが表示されます。ブラウザから該当のIP:Portでアクセスしてください。ECHONET Lite Web APIの説明ページが表示されます。
```
ubuntu:~/somepass/SmartHomeSimulator/src$ node app.js
this is IPv4 and IP is detected
172.17.96.137
listen on 172.17.96.137:8010
```
上記の場合、ブラウザから`http://172.17.96.137:8010`でアクセスしてください。IPアドレス判定ルーチンはさらに改良の余地があり、実行環境によってはIPアドレスが特定できない場合があります。ご了承ください。なお、本ソフトウエアの仕様や詳しい使い方はWikiに記載する予定です。

# 現在分かっている不具合、未実装機能について
1. 本ソフトウエアのAPI仕様はECHONET Lite Web APIの仕様をベースに作成していますが、Web APIのすべての機能を実装しているわけではありません。特に家電が持っている属性を定義するDevice Description(機器情報定義)については、エコーネットコンソーシアムの仕様書のサンプルを引用しています(IoT House Simulatorが提供する家電の属性を正確に反映したものにはなっていません)。また、APIはローカルネットワークでの利用を想定しており認証機能は実装していません。
1. 実行環境のeth0のIPを特定してListen IPを決定しますが、正しくListen IPを決められない場合があります。もしIPを正しく判定できない場合、node  app.jp  --ip <ip_address> の形式でIPアドレスを指定してアプリを起動してください。
2. ECHONET Lite Web APIとIoT House Simulator間はWeb Socketにより通信しています。通信は非同期であるため、リクエスト（処理要求）電文とレスポンス（処理応答）電文の対応付けが必要です。交わされる電文の対応付けを可能にするため通信電文内にユニークIDを挿入していますが、ユニークIDの生成が固定値のままであり、さらに対応付けのコードが未実装です。ですので、現状では送受信される電文の対応付けが実装できていません。送受信が忙しくなりすぎると、電文を取り違える問題があります。対応策としては、ユニークIDの生成と突き合わせのためのコード実装が必要です。
3. ログ出力を正しく管理できていません。Node.jsによるアプリの場合、どのように実行ログを処理させるのが標準仕様なのかわかっておらず、現在は起動コンソールに出されるままになっています。

# ECHONET Lite Web API仕様書類
ECHONET Lite Web APIの仕様書類はエコーネットコンソーシアムのWebPageから入手できます。
- ECHONET Lite Web API ガイドライン
- https://echonet.jp/web_api_guideline/

# エラーや不明点につきまして
正しく動作しない、エラーが発生する、仕様が分からない等、お問い合わせについてはIssueを発行してください。画面上の左の方にIssuesメニューがあると思います。ご質問には極力回答するようにします。機能追加については時間があればぼちぼち進めます。

# フリー素材イラスト引用元
IoT Home Simulatorを構成する画像は以下のサイトから入手しました。
1. リビングの画像
    - https://www.irasutoya.com/2016/01/blog-post_133.html
    - Copyright(c) いらすとや. All Rights Reserved.
2. 時計の画像
    - https://frame-illust.com/?p=9756
    - Copyright(c) 無料フリーイラスト素材集【Frame illust】
