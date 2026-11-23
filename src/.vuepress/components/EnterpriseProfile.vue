<template>
  <div class="ep-root">
    <div class="topbar">
      <div class="crumb">产品中心 <i>/</i> 数据画像原型 <i>/</i> <b>北京智云账联科技有限公司</b></div>
      <div class="top-right">
        <span class="sync">数据截止 2026-10 · 更于 2026-11-19 02:30</span>
        <div class="avatar">李</div>
      </div>
    </div>

    <main class="content">
      <section class="hero card" id="overview">
        <div class="hero-main">
          <div class="hero-top">
            <div class="logo-chip">智</div>
            <div>
              <h1>北京智云账联科技有限公司 <span class="badge-verified">已实名认证</span></h1>
              <div class="hero-meta">
                <span>统一社会信用代码 <span class="code">91110108MA01F8XK3T</span><button class="copy-btn" @click="copyCode">{{copyState ? "已复制" : "复制"}}</button></span>
                <span class="sep"></span>
                <span>法定代表人 陈立</span>
                <span class="sep"></span>
                <span>成立日期 2016-03-18</span>
              </div>
            </div>
          </div>
          <div class="tag-row">
            <span class="tag blue">民营企业</span>
            <span class="tag teal">高新技术企业</span>
            <span class="tag violet">专精特新中小企业</span>
            <span class="tag green">纳税信用 A 级</span>
            <span class="tag gray">存续（在营）</span>
          </div>
          <div class="hero-facts">
            <div><label>注册资本</label><strong>1,200<span>万元</span></strong></div>
            <div><label>所属行业</label><strong class="text">软件和信息技术服务业</strong></div>
            <div><label>注册地区</label><strong class="text">北京市 · 海淀区</strong></div>
            <div><label>从业人数</label><strong>86<span>人</span></strong></div>
            <div><label>经营年限</label><strong>10<span>年 8 个月</span></strong></div>
          </div>
          <div class="insight">
            <span class="ai-mark">智能研判</span>
            <p>近 12 个月营业收入同比 <b>+18.4%</b>，票财税银数据整体一致度 <b>93%</b>，未发现失信、被执行等重大司法风险。建议关注 <b>应收账款周转天数上升</b> 与 <b>第一大客户集中度</b> 两项经营指标。</p>
          </div>
        </div>

        <aside class="score-panel">
          <div class="score-head">综合信用评分 <span>2026-10</span></div>
          <div class="score-ring">
            <svg width="148" height="148" viewBox="0 0 148 148">
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#2f7ef3"/>
                  <stop offset="100%" stop-color="#0f9f9a"/>
                </linearGradient>
              </defs>
              <circle cx="74" cy="74" r="62" fill="none" stroke="#e9f0f9" stroke-width="11"/>
              <circle ref="scoreRing" cx="74" cy="74" r="62" fill="none" stroke="url(#scoreGrad)"
                      stroke-width="11" stroke-linecap="round" stroke-dasharray="389.56" stroke-dashoffset="389.56"/>
            </svg>
            <div class="score-center"><b>87</b><small>/ 100</small></div>
          </div>
          <div class="score-grade">
            <span class="grade">AA</span>
            <span class="risk-low">低风险</span>
          </div>
          <div class="score-bars">
            <div><span>经营稳定性</span><i><em style="width:92%"></em></i><b>92</b></div>
            <div><span>履约能力</span><i><em style="width:85%"></em></i><b>85</b></div>
            <div><span>成长性</span><i><em style="width:88%"></em></i><b>88</b></div>
            <div><span>风险敞口</span><i><em style="width:80%"></em></i><b>80</b></div>
          </div>
        </aside>
      </section>

      <div class="kpi-grid">
        <div class="kpi"><span class="kpi-label">近 12 月营业收入 <i>万元</i></span><strong>6,695.4</strong><div class="kpi-foot up">↑ 18.4% <em>同比</em></div></div>
        <div class="kpi"><span class="kpi-label">近 12 月净利润 <i>万元</i></span><strong>796.5</strong><div class="kpi-foot up">↑ 21.7% <em>同比</em></div></div>
        <div class="kpi"><span class="kpi-label">有效发票金额 <i>万元</i></span><strong>7,031.2</strong><div class="kpi-foot up">↑ 6.2% <em>环比</em></div></div>
        <div class="kpi"><span class="kpi-label">下游企业客户 <i>家</i></span><strong>68</strong><div class="kpi-foot up">↑ 7 <em>较上期</em></div></div>
        <div class="kpi"><span class="kpi-label">授信总额度 <i>万元</i></span><strong>800<small>已用 320</small></strong><div class="kpi-foot"><em>用信率</em> 40.0%</div></div>
        <div class="kpi warn"><span class="kpi-label">风险预警 <i>项</i></span><strong>3</strong><div class="kpi-foot"><em>关注</em> 2 · <em>提示</em> 1</div></div>
      </div>

      <nav class="anchor-bar" ref="anchorBar">
        <a v-for="a in anchors" :key="a.id" class="anchor-link" :class="{active: activeAnchor===a.id}" :href="'#'+a.id" @click.prevent="scrollTo(a.id)">{{a.label}}</a>
      </nav>

      <section class="block" id="business">
        <div class="section-head"><h2>工商信息</h2><span class="section-sub">来源：工商登记信息 · 年报信息 · 市场监督管理局</span></div>
        <div class="card">
          <div class="info-grid">
            <div class="info-item"><label>企业名称</label><span>北京智云账联科技有限公司</span></div>
            <div class="info-item"><label>统一社会信用代码</label><span>91110108MA01F8XK3T</span></div>
            <div class="info-item"><label>法定代表人</label><span>陈立</span></div>
            <div class="info-item"><label>登记状态</label><span>存续（在营、开业、在册）</span></div>
            <div class="info-item"><label>企业性质</label><span>有限责任公司（自然人投资或控股）</span></div>
            <div class="info-item"><label>纳税人性质</label><span>增值税一般纳税人</span></div>
            <div class="info-item"><label>注册资本</label><span>1,200.00 万元人民币</span></div>
            <div class="info-item"><label>成立日期</label><span>2016-03-18</span></div>
            <div class="info-item"><label>营业期限</label><span>2016-03-18 至 2036-03-17</span></div>
            <div class="info-item"><label>所属行业</label><span>软件和信息技术服务业（I65）</span></div>
            <div class="info-item"><label>从业人数</label><span>86 人</span></div>
            <div class="info-item"><label>注册地址</label><span>北京市海淀区上地信息路 12 号 3 号楼 5 层</span></div>
            <div class="info-item"><label>联系人</label><span>王倩</span></div>
            <div class="info-item"><label>联系电话</label><span>138****6721</span></div>
            <div class="info-item"><label>联系邮箱</label><span>wangqian@zhiyunzl.com</span></div>
          </div>
          <div class="scope-box">
            <label>经营范围</label>
            <p>技术开发、技术咨询、技术转让、技术服务；软件开发；数据处理；计算机系统集成；基础软件服务；应用软件服务；销售自行开发的产品、计算机、软件及辅助设备；企业管理咨询；财务咨询。（依法须经批准的项目，经相关部门批准后方可开展经营活动）</p>
          </div>
          <div class="mini-row">
            <div class="mini"><span class="mini-ico teal">异</span><div><b>0</b><label>经营异常记录</label></div></div>
            <div class="mini"><span class="mini-ico amber">罚</span><div><b>2</b><label>行政处罚记录</label></div></div>
            <div class="mini"><span class="mini-ico blue">质</span><div><b>1</b><label>股权出质记录</label></div></div>
            <div class="mini"><span class="mini-ico red">抵</span><div><b>1</b><label>动产抵押记录</label></div></div>
          </div>
        </div>
      </section>

      <section class="block" id="finance">
        <div class="section-head"><h2>财务分析</h2><span class="section-sub">来源：财务报表（资产负债表 / 利润表 / 现金流量表）· 财务分析指标表</span></div>
        <div class="grid-2">
          <div class="card">
            <div class="card-head">
              <h3>经营趋势</h3>
              <div class="head-tools">
                <div class="legend"><span class="l-rev">营业收入</span><span class="l-net">净利润</span></div>
                <div class="seg">
                  <button :class="{on: trendRange===12}" @click="trendRange=12">近 12 月</button>
                  <button :class="{on: trendRange===24}" @click="trendRange=24">近 24 月</button>
                </div>
              </div>
            </div>
            <div class="chart-wrap" ref="trendWrap">
              <svg ref="trendSvg" class="trend-svg" viewBox="0 0 780 268" role="img" aria-label="近12个月营业收入与净利润趋势" @mousemove="trendMove" @mouseleave="trendLeave">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#2f7ef3" stop-opacity=".18"/>
                    <stop offset="100%" stop-color="#2f7ef3" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <g :ref="el => setLayer('grid', el)"></g>
                <g :ref="el => setLayer('series', el)"></g>
                <g :ref="el => setLayer('axis', el)"></g>
                <g :style="{opacity: hover.show ? 1 : 0}">
                  <line :x1="hover.cx" y1="20" :x2="hover.cx" y2="232" stroke="#b9cadd" stroke-width="1" stroke-dasharray="4 4"/>
                  <circle :cx="hover.cx" :cy="hover.cy1" r="4.5" fill="#2f7ef3" stroke="#fff" stroke-width="2"/>
                  <circle :cx="hover.cx" :cy="hover.cy2" r="4.5" fill="#0f9f9a" stroke="#fff" stroke-width="2"/>
                </g>
              </svg>
              <div class="chart-tip" :class="{show: hover.show}" :style="{left: hover.tipLeft+'px', top: hover.tipTop+'px'}">
                <span class="t-m">{{hover.month}}</span>
                <div class="t-row"><span><i style="background:#2f7ef3"></i>营业收入</span><span>{{hover.rev}} 万元</span></div>
                <div class="t-row"><span><i style="background:#0f9f9a"></i>净利润</span><span>{{hover.pro}} 万元</span></div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><h3>经营能力雷达</h3><span class="hint">行业分位：前 18%</span></div>
            <div class="radar-wrap">
              <svg class="radar" viewBox="0 0 360 300" role="img" aria-label="经营能力雷达图"><g :ref="el => setLayer('radar', el)"></g></svg>
            </div>
          </div>
        </div>

        <div class="cap-grid">
          <div class="cap-card">
            <h4>盈利能力 <b>优秀</b></h4>
            <div class="cap-row"><span>销售毛利率</span><b>32.6%</b></div>
            <div class="cap-row"><span>营业利润率</span><b>14.8%</b></div>
            <div class="cap-row"><span>净资产收益率</span><b>18.2%</b></div>
            <div class="cap-bar"><em style="width:88%"></em></div>
          </div>
          <div class="cap-card">
            <h4>偿债能力 <b>良好</b></h4>
            <div class="cap-row"><span>资产负债率</span><b>41.3%</b></div>
            <div class="cap-row"><span>流动比率</span><b>1.86</b></div>
            <div class="cap-row"><span>利息保障倍数</span><b>9.4</b></div>
            <div class="cap-bar"><em style="width:82%"></em></div>
          </div>
          <div class="cap-card">
            <h4>营运效率 <b>良好</b></h4>
            <div class="cap-row"><span>总资产周转率</span><b>1.32</b></div>
            <div class="cap-row"><span>存货周转率</span><b>6.8</b></div>
            <div class="cap-row"><span>应收账款周转率</span><b>5.1</b></div>
            <div class="cap-bar"><em style="width:79%"></em></div>
          </div>
          <div class="cap-card">
            <h4>成长能力 <b>优秀</b></h4>
            <div class="cap-row"><span>营收增长率</span><b>18.4%</b></div>
            <div class="cap-row"><span>净利润增长率</span><b>21.7%</b></div>
            <div class="cap-row"><span>总资产增长率</span><b>12.9%</b></div>
            <div class="cap-bar"><em style="width:91%"></em></div>
          </div>
        </div>
      </section>

      <section class="block" id="invoice">
        <div class="section-head"><h2>票税银分析</h2><span class="section-sub">来源：增值税发票 · 纳税申报 · 银行流水 · 票税银分析指标</span></div>
        <div class="grid-2">
          <div class="card">
            <div class="card-head"><h3>核心指标</h3><span class="hint">统计口径：近 12 个月</span></div>
            <div class="card-body">
              <div class="stat-tiles">
                <div class="stat-tile"><label>应税销售收入</label><b>6,398.5<small>万元</small></b></div>
                <div class="stat-tile"><label>月均应税销售收入</label><b>639.9<small>万元</small></b></div>
                <div class="stat-tile"><label>有效发票金额</label><b>7,031.2<small>万元</small></b></div>
                <div class="stat-tile"><label>有效发票税额</label><b>402.7<small>万元</small></b></div>
                <div class="stat-tile"><label>月均开票金额</label><b>703.1<small>万元</small></b></div>
                <div class="stat-tile"><label>近 12 月有效流入</label><b>7,846.3<small>万元</small></b></div>
                <div class="stat-tile"><label>近 12 月日均余额</label><b>268.4<small>万元</small></b></div>
                <div class="stat-tile"><label>有效开票月数</label><b>12<small>个月</small></b></div>
              </div>
              <div class="client-list">
                <div class="list-title"><span>主要下游客户 TOP5</span><span>开票金额 / 占比</span></div>
                <div v-for="c in topClients" :key="c.name" class="client-row">
                  <span class="cname">{{c.name}}</span>
                  <span class="cbar"><em :style="{width: c.pct+'%'}"></em></span>
                  <span class="cval">{{c.amt}}<span>{{c.share}}</span></span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><h3>财税数据一致性</h3><span class="hint">财务报表 vs 纳税申报</span></div>
            <div class="card-body">
              <div class="consist-total">
                <div><div class="ct-label">整体一致度</div><div class="ct-value">93.0<small>%</small></div></div>
                <span class="ct-note">高于同业 12.4%</span>
              </div>
              <div v-for="p in consistRows" :key="p.name" class="prog-row">
                <span>{{p.name}}</span>
                <i><em :class="{warn: p.warn}" :style="{width: p.v+'%'}"></em></i>
                <b>{{p.v}}%</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="block" id="risk">
        <div class="section-head"><h2>风险全景</h2><span class="section-sub">来源：工商风险 · 税务处罚 · 司法涉诉 · 异常预警指标</span></div>
        <div class="grid-2 rev">
          <div class="card">
            <div class="card-head"><h3>风险分类统计</h3><span class="hint">实时监测</span></div>
            <div class="card-body">
              <div class="risk-cats">
                <div class="risk-cat mid"><b>2</b><label>工商风险</label></div>
                <div class="risk-cat mid"><b>1</b><label>税务风险</label></div>
                <div class="risk-cat zero"><b>0</b><label>司法风险</label></div>
                <div class="risk-cat zero"><b>0</b><label>信用违约</label></div>
              </div>
              <div class="indicator-title">异常预警指标监测（8 项）</div>
              <div class="indicator-grid">
                <div v-for="ind in indicators" :key="ind.name" class="indicator" :class="{warn: ind.warn}"><i></i><span>{{ind.name}}</span><b>{{ind.val}}</b></div>
              </div>
              <a class="more-link" href="#metrics">查看全部 40 项监测指标 →</a>
            </div>
          </div>

          <div class="card">
            <div class="card-head"><h3>风险事件</h3><span class="hint">共 3 条在途 · 按严重程度排序</span></div>
            <div class="card-body">
              <div class="alert-list">
                <div v-for="al in alerts" :key="al.title" class="alert" :class="al.level">
                  <span class="level"></span>
                  <div>
                    <h5>{{al.title}} <span class="lv" :class="al.lvCls">{{al.lv}}</span></h5>
                    <p>{{al.desc}}</p>
                  </div>
                  <span class="date">{{al.date}}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="block" id="metrics">
        <div class="section-head">
          <h2>指标明细</h2>
          <span class="section-sub">指标按 SQL 四张 AI 分析表分组，共 145 项</span>
        </div>
        <div class="card">
          <div class="metrics-head">
            <div class="metric-tabs">
              <button v-for="t in metricTabs" :key="t.key" class="metric-tab" :class="{on: activeTab===t.key}" @click="activeTab=t.key">
                <i>{{t.cn}}</i>{{t.table}} <b>{{t.count}}</b>
              </button>
            </div>
            <span class="metrics-meta">报送月度 2026-10 · 统计日期 2026-10-31</span>
          </div>

          <div v-if="activeTab==='fin'" class="metric-panel on">
            <div class="table-tag">数据表 <code>tb_ai_financial_analysis_index</code> · 财务分析指标（59 项）</div>
            <div v-for="g in finGroups" :key="g.name" class="metric-group">
              <h4>{{g.name}} <i>{{g.items.length}} 项</i></h4>
              <div class="metric-grid">
                <div v-for="m in g.items" :key="m.label" class="metric"><label>{{m.label}}</label><b>{{m.v}}<small>{{m.u}}</small></b></div>
              </div>
            </div>
            <div class="metrics-note">
              <span>数据来源：<b>财务报表 / 纳税申报</b></span>
              <span>验证方式：<b>系统计算 + 交叉校验</b></span>
              <span>指标表：<b>tb_ai_financial_analysis_index</b></span>
            </div>
          </div>

          <div v-else-if="activeTab==='inv'" class="metric-panel on">
            <div class="table-tag">数据表 <code>tb_ai_invoice_analysis_index</code> · 票税银分析指标（27 项）+ 6 张 TOP 榜单子表</div>
            <div v-for="g in invGroups" :key="g.name" class="metric-group">
              <h4>{{g.name}} <i v-if="g.items">{{g.items.length}} 项</i></h4>
              <div v-if="g.items" class="metric-grid">
                <div v-for="m in g.items" :key="m.label" class="metric"><label>{{m.label}}</label><b>{{m.v}}<small>{{m.u}}</small></b></div>
              </div>
              <div v-else class="struct-grid">
                <div v-for="s in topBoards" :key="s.title" class="struct-card">
                  <h5>{{s.title}} <span>{{s.source}}</span></h5>
                  <div v-for="(r,i) in s.rows" :key="i" class="srow"><i>{{i+1}}</i><span>{{r.name}}</span><b>{{r.v}}</b></div>
                </div>
              </div>
            </div>
            <div class="metrics-note">
              <span>数据来源：<b>电子税务局 / 增值税发票 / 银行流水</b></span>
              <span>验证方式：<b>接口校验 + 交叉比对</b></span>
              <span>指标表：<b>tb_ai_invoice_analysis_index</b></span>
            </div>
          </div>

          <div v-else-if="activeTab==='con'" class="metric-panel on">
            <div class="table-tag">数据表 <code>tb_ai_financial_and_tax_report_consistency_index</code> · 财税一致性指标（19 项）</div>
            <div class="metrics-summary">
              <span><b>93.0%</b>整体一致度</span>
              <span>高于同业 <b>12.4%</b></span>
              <span class="ok-text">19 项指标均高于 85% 阈值</span>
            </div>
            <div class="prog-grid">
              <div v-for="p in conRows" :key="p.name" class="prog-row">
                <span>{{p.name}}</span><i><em :class="{warn: p.warn}" :style="{width: p.v+'%'}"></em></i><b>{{p.v}}%</b>
              </div>
            </div>
            <div class="metrics-note">
              <span>数据来源：<b>财务报表 / 纳税申报 / 发票 / 银行流水</b></span>
              <span>验证方式：<b>四流交叉校验</b></span>
              <span>指标表：<b>tb_ai_financial_and_tax_report_consistency_index</b></span>
            </div>
          </div>

          <div v-else class="metric-panel on">
            <div class="table-tag">数据表 <code>tb_ai_exception_alert_index</code> · 异常预警指标（40 项）</div>
            <div class="metrics-summary">
              <span><b>40</b>项监测指标</span>
              <span>触发阈值 <b>0</b> 项</span>
              <span class="ok-text">经营、收入与发票行为均未触发预警</span>
            </div>
            <div v-for="g in altGroups" :key="g.name" class="metric-group">
              <h4>{{g.name}} <i>{{g.items.length}} 项</i></h4>
              <div class="metric-grid three">
                <div v-for="m in g.items" :key="m.label" class="metric">
                  <label>{{m.label}}</label>
                  <span v-if="m.pill" class="v-pill ok">{{m.pill}}</span>
                  <b v-else>{{m.v}}<small>{{m.u}}</small></b>
                </div>
              </div>
            </div>
            <div class="metrics-note">
              <span>数据来源：<b>电子税务局 / 增值税发票 / 财务报表 / 银行流水</b></span>
              <span>验证方式：<b>规则引擎 + 逻辑比对</b></span>
              <span>指标表：<b>tb_ai_exception_alert_index</b></span>
            </div>
          </div>
        </div>
      </section>

      <section class="block" id="innovation">
        <div class="section-head"><h2>科创能力</h2><span class="section-sub">来源：专利信息 · 软件著作权信息</span></div>
        <div class="grid-2 even">
          <div class="card">
            <div class="card-head"><h3>知识产权规模</h3><span class="hint">累计 47 项</span></div>
            <div class="card-body">
              <div class="ip-stats">
                <div class="ip-stat"><b>12<small>件</small></b><label>专利 · 发明 7 / 实用新型 4 / 外观 1</label></div>
                <div class="ip-stat"><b>27<small>件</small></b><label>软件著作权</label></div>
                <div class="ip-stat"><b>8<small>件</small></b><label>注册商标</label></div>
              </div>
              <div v-for="ip in ipList" :key="ip.title" class="ip-row">
                <span class="tag" :class="ip.cls">{{ip.type}}</span>
                <div><h6>{{ip.title}}</h6><p>{{ip.sub}}</p></div>
                <span class="ip-date">{{ip.date}}</span>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-head"><h3>研发与资质</h3><span class="hint">近 3 年</span></div>
            <div class="card-body">
              <div v-for="rd in rdList" :key="rd.title" class="ip-row">
                <span class="tag" :class="rd.cls">{{rd.type}}</span>
                <div><h6>{{rd.title}}</h6><p>{{rd.sub}}</p></div>
                <span class="ip-date">{{rd.date}}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="block" id="financing">
        <div class="section-head"><h2>融资授信</h2><span class="section-sub">来源：融资需求上报表 · 企业获贷上报表 · 平台授信数据</span></div>
        <div class="fin-stack">
          <div class="card">
            <div class="card-head"><h3>融资需求记录</h3><span class="hint">共 3 条</span></div>
            <div class="card-body overflow-x">
              <table>
                <thead><tr><th>需求编号</th><th>关注银行</th><th>金额</th><th>期限</th><th>利率</th><th>担保方式</th><th>状态</th></tr></thead>
                <tbody>
                  <tr v-for="r in loanRows" :key="r.no">
                    <td>{{r.no}}</td><td>{{r.bank}}</td><td class="num">{{r.amt}}</td><td class="num">{{r.term}}</td>
                    <td class="num">{{r.rate}}</td><td>{{r.guar}}</td>
                    <td><span class="status" :class="r.stCls">{{r.status}}</span></td>
                  </tr>
                </tbody>
              </table>
              <div class="loan-summary">
                <div><label>累计获贷金额</label><b>500<small>万元</small></b></div>
                <div><label>当前在用余额</label><b>320<small>万元</small></b></div>
                <div><label>平均贷款利率</label><b>3.90<small>%</small></b></div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-head"><h3>获贷记录</h3><span class="hint">来源：平台放款数据</span></div>
            <div class="card-body">
              <div class="timeline">
                <div v-for="t in loanTimeline" :key="t.bank" class="tl-item">
                  <div class="tl-head"><h6>{{t.bank}}</h6><span class="tl-amt">{{t.amt}}</span></div>
                  <p>{{t.desc}}</p>
                </div>
              </div>
              <div class="auth-foot">
                <span>贷款用途：<b>生产经营周转</b></span>
                <span>还款方式：<b>按月付息、到期还本</b></span>
                <span>当前状态：<b class="green-text">正常履约</b></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="block" id="auth">
        <div class="section-head"><h2>数据授权</h2><span class="section-sub">来源：融信平台数据授权上报表 · 信易贷授权数据</span></div>
        <div class="card">
          <div class="card-body">
            <div class="auth-grid">
              <div v-for="a in authItems" :key="a.n" class="auth-item" :class="{off: a.off}">{{a.n}}</div>
            </div>
            <div class="auth-foot">
              <span>授权文件：<b>3 份</b></span>
              <span>最近授权：<b>2026-08-12 至 2027-08-11</b></span>
              <span>授权来源：<b>金融机构 / 融资平台</b></span>
              <span>累计查询：<b>14 次</b></span>
              <span>数据更新：<b>2026-11-19 02:30</b></span>
            </div>
          </div>
        </div>
      </section>

      <p class="page-foot">
        数据来源：工商登记、纳税申报、增值税发票、银行流水、社保公积金、电力用水、司法涉诉、信易贷及融信查授权数据。<br>
        本页面为企业数据画像产品原型演示，展示数据均为模拟数据，不构成任何授信或评级结论。
      </p>
    </main>

    <nav class="side-nav" aria-label="页面锚点导航">
      <a
        v-for="a in anchors"
        :key="'side-'+a.id"
        class="side-item"
        :class="{ active: activeAnchor === a.id }"
        :href="'#' + a.id"
        @click.prevent="scrollTo(a.id)"
      >
        <i></i><span>{{ a.label }}</span>
      </a>
    </nav>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from "vue";

const anchors = [
  { id: "business", label: "工商信息" },
  { id: "finance", label: "财务分析" },
  { id: "invoice", label: "票税银分析" },
  { id: "risk", label: "风险全景" },
  { id: "metrics", label: "指标明细" },
  { id: "innovation", label: "科创能力" },
  { id: "financing", label: "融资授信" },
  { id: "auth", label: "数据授权" },
];
const activeAnchor = ref("business");

const copyState = ref(false);
function copyCode() {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText("91110108MA01F8XK3T");
  }
  copyState.value = true;
  setTimeout(() => (copyState.value = false), 1600);
}

const trendRange = ref(12);
const scoreRing = ref(null);
const trendWrap = ref(null);
const trendSvg = ref(null);
const anchorBar = ref(null);

function scrollTo(id) {
  activeAnchor.value = id;
  const el = document.getElementById(id);
  if (!el) return;
  const barH = (anchorBar.value ? anchorBar.value.offsetHeight : 44) + 12;
  const y = el.getBoundingClientRect().top + window.scrollY - barH;
  window.scrollTo({ top: y, behavior: "smooth" });
}
function onScroll() {
  const barH = (anchorBar.value ? anchorBar.value.offsetHeight : 44) + 24;
  let cur = activeAnchor.value;
  for (const a of anchors) {
    const el = document.getElementById(a.id);
    if (el && el.getBoundingClientRect().top - barH <= 0) cur = a.id;
  }
  if (cur !== activeAnchor.value) activeAnchor.value = cur;
}
onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
});

const NS = "http://www.w3.org/2000/svg";
function node(tag, attrs, text) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (text !== undefined) el.textContent = text;
  return el;
}

const W = 780, H = 268, PL = 56, PR = 52, PT = 20, PB = 36;
const IW = W - PL - PR, IH = H - PT - PB;

const months12 = ["2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07","2026-08","2026-09","2026-10"];
const revenue12 = [442.6,463.2,486.2,512.4,498.7,545.1,571.8,604.3,589.5,632.0,658.4,691.2];
const profit12 = [48.5,51.2,55.2,59.1,54.6,63.4,68.2,74.0,71.3,79.5,83.1,88.4];
const months24 = ["2024-11","2024-12","2025-01","2025-02","2025-03","2025-04","2025-05","2025-06","2025-07","2025-08","2025-09","2025-10",...months12];
const revenue24 = [352.4,381.2,368.5,395.6,402.8,418.3,431.6,452.2,448.7,476.5,492.8,508.3,...revenue12];
const profit24 = [32.6,36.8,34.2,38.5,40.1,42.6,45.3,49.8,48.2,53.6,57.4,60.2,...profit12];

const layers = { grid: null, series: null, axis: null, radar: null };
function setLayer(name, el) { layers[name] = el; }

function buildTrend() {
  if (!layers.grid || !layers.series || !layers.axis) return;
  const n = trendRange.value;
  const months = trendRange.value === 12 ? months12 : months24;
  const revenue = trendRange.value === 12 ? revenue12 : revenue24;
  const profit = trendRange.value === 12 ? profit12 : profit24;
  const xAt = (i) => PL + (IW * i) / (n - 1);
  const yRev = (v) => PT + IH - (v / 800) * IH;
  const yPro = (v) => PT + IH - (v / 120) * IH;

  layers.grid.innerHTML = "";
  layers.axis.innerHTML = "";
  layers.series.innerHTML = "";
  for (let g = 0; g <= 4; g++) {
    const y = PT + (IH * g) / 4;
    layers.grid.appendChild(node("line", { x1: PL, y1: y, x2: W - PR, y2: y, stroke: g === 4 ? "#dfe7f1" : "#eef3f9", "stroke-width": 1 }));
    layers.axis.appendChild(node("text", { x: PL - 10, y: y + 3.5, "text-anchor": "end", class: "axis-text" }, Math.round(800 - g * 200).toString()));
    layers.axis.appendChild(node("text", { x: W - PR + 10, y: y + 3.5, "text-anchor": "start", class: "axis-text" }, Math.round(120 - g * 30).toString()));
  }
  const linePath = revenue.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yRev(v).toFixed(1)).join(" ");
  layers.series.appendChild(node("path", { d: linePath + " L" + xAt(n - 1).toFixed(1) + "," + (PT + IH) + " L" + PL + "," + (PT + IH) + " Z", fill: "url(#areaGrad)" }));
  layers.series.appendChild(node("path", { d: linePath, fill: "none", stroke: "#2f7ef3", "stroke-width": 2.4, "stroke-linecap": "round", "stroke-linejoin": "round" }));
  const proLine = profit.map((v, i) => (i ? "L" : "M") + xAt(i).toFixed(1) + "," + yPro(v).toFixed(1)).join(" ");
  layers.series.appendChild(node("path", { d: proLine, fill: "none", stroke: "#0f9f9a", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }));
  revenue.forEach((v, i) => layers.series.appendChild(node("circle", { cx: xAt(i), cy: yRev(v), r: n > 13 ? 1.6 : 2.6, fill: "#fff", stroke: "#2f7ef3", "stroke-width": 1.4 })));
  profit.forEach((v, i) => layers.series.appendChild(node("circle", { cx: xAt(i), cy: yPro(v), r: n > 13 ? 1.4 : 2.2, fill: "#fff", stroke: "#0f9f9a", "stroke-width": 1.3 })));
  months.forEach((m, i) => {
    if (i % 2 !== 0 && i !== n - 1) return;
    layers.axis.appendChild(node("text", { x: xAt(i), y: H - 12, "text-anchor": "middle", class: "axis-text" }, m.slice(2).replace("-", "/")));
  });
}

function buildRadar() {
  if (!layers.radar) return;
  const data = [["盈利能力", 88], ["偿债能力", 82], ["营运效率", 79], ["成长能力", 91], ["现金流质量", 84], ["信用履约", 95]];
  const cx = 180, cy = 150, R = 96;
  const point = (i, r) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };
  layers.radar.innerHTML = "";
  [0.25, 0.5, 0.75, 1].forEach((k) => {
    layers.radar.appendChild(node("polygon", { points: data.map((_, i) => point(i, R * k).join(",")).join(" "), fill: k === 1 ? "#f8fbfe" : "none", stroke: "#e3eaf4", "stroke-width": 1 }));
  });
  data.forEach((_, i) => {
    const p = point(i, R);
    layers.radar.appendChild(node("line", { x1: cx, y1: cy, x2: p[0], y2: p[1], stroke: "#e9eef6", "stroke-width": 1 }));
  });
  layers.radar.appendChild(node("polygon", { points: data.map((d, i) => point(i, (R * d[1]) / 100).join(",")).join(" "), fill: "rgba(47,126,243,.17)", stroke: "#2f7ef3", "stroke-width": 2, "stroke-linejoin": "round" }));
  data.forEach((d, i) => {
    const p = point(i, (R * d[1]) / 100);
    layers.radar.appendChild(node("circle", { cx: p[0], cy: p[1], r: 3.4, fill: "#fff", stroke: "#2f7ef3", "stroke-width": 2 }));
    const lp = point(i, R + 28);
    const anchor = Math.abs(lp[0] - cx) < 8 ? "middle" : lp[0] > cx ? "start" : "end";
    layers.radar.appendChild(node("text", { x: lp[0], y: lp[1] - 1, "text-anchor": anchor, class: "radar-label" }, d[0]));
    layers.radar.appendChild(node("text", { x: lp[0], y: lp[1] + 14, "text-anchor": anchor, class: "radar-value" }, String(d[1])));
  });
}

onMounted(() => {
  nextTick(() => { buildTrend(); buildRadar(); });
  requestAnimationFrame(() => {
    if (scoreRing.value) {
      scoreRing.value.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)";
      scoreRing.value.style.strokeDashoffset = "50.6";
    }
  });
});

watch(trendRange, () => nextTick(buildTrend));

const hover = reactive({ show: false, cx: 0, cy1: 0, cy2: 0, tipLeft: 0, tipTop: 0, month: "", rev: "", pro: "" });
const fmt = (v) => v.toLocaleString("zh-CN", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
function trendMove(e) {
  const svg = trendSvg.value, wrap = trendWrap.value;
  if (!svg || !wrap) return;
  const rect = svg.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (W / rect.width);
  const n = trendRange.value;
  let idx = Math.round((px - PL) / (IW / (n - 1)));
  idx = Math.max(0, Math.min(n - 1, idx));
  const months = trendRange.value === 12 ? months12 : months24;
  const revenue = trendRange.value === 12 ? revenue12 : revenue24;
  const profit = trendRange.value === 12 ? profit12 : profit24;
  const xAt = (i) => PL + (IW * i) / (n - 1);
  const yRev = (v) => PT + IH - (v / 800) * IH;
  const yPro = (v) => PT + IH - (v / 120) * IH;
  hover.cx = xAt(idx);
  hover.cy1 = yRev(revenue[idx]);
  hover.cy2 = yPro(profit[idx]);
  hover.show = true;
  hover.month = months[idx];
  hover.rev = fmt(revenue[idx]);
  hover.pro = fmt(profit[idx]);
  const scaleX = rect.width / W, scaleY = rect.height / H;
  const wrapRect = wrap.getBoundingClientRect();
  let left = hover.cx * scaleX + (rect.left - wrapRect.left);
  left = Math.max(95, Math.min(rect.width - 95, left));
  hover.tipLeft = left;
  hover.tipTop = Math.min(hover.cy1, hover.cy2) * scaleY + (rect.top - wrapRect.top);
}
function trendLeave() { hover.show = false; }

const topClients = [
  { name: "北京中科数智科技有限公司", amt: "1,308.0", share: "18.6%", pct: 100 },
  { name: "国网信通产业集团有限公司", amt: "962.5", share: "13.7%", pct: 74 },
  { name: "上海云枢信息技术有限公司", amt: "528.3", share: "7.5%", pct: 40 },
  { name: "天津恒瑞供应链管理有限公司", amt: "402.6", share: "5.7%", pct: 31 },
  { name: "深圳启明智能科技有限公司", amt: "351.4", share: "5.0%", pct: 27 },
];
const consistRows = [
  { name: "营业收入", v: 96.4 }, { name: "营业成本", v: 94.1 }, { name: "利润总额", v: 89.7 },
  { name: "净利润", v: 91.2 }, { name: "资产总额", v: 97.8 }, { name: "负债总额", v: 95.3 },
  { name: "销项发票与收入", v: 93.6 }, { name: "银行流水与发票", v: 88.9, warn: true },
];
const indicators = [
  { name: "营业状态非正常", val: "否" }, { name: "法定代表人发生变动", val: "否" },
  { name: "销售收入连续 2 月下降", val: "否" }, { name: "连续两个季度亏损", val: "否" },
  { name: "当前欠税状态", val: "否" }, { name: "近 6 月零销售额申报", val: "0 次" },
  { name: "近 6 月税务处罚 > 2 次", val: "否" }, { name: "近 12 月下游客户数 < 4", val: "否" },
];
const alerts = [
  { title: "税务行政处罚", lv: "关注", lvCls: "mid", level: "high", desc: "未按期办理纳税申报，处以罚款 2,000 元 · 国家税务总局北京市海淀区税务局", date: "2026-04-18" },
  { title: "股权出质", lv: "关注", lvCls: "mid", level: "", desc: "股东陈立出质股权 240 万元，质权人为北京中关村银行股份有限公司，状态存续", date: "2025-09-12" },
  { title: "动产抵押", lv: "关注", lvCls: "mid", level: "", desc: "生产设备融资租赁抵押，被担保债权数额 180 万元，抵押权人为中关村科技租赁股份有限公司", date: "2025-06-30" },
  { title: "经营指标预警", lv: "提示", lvCls: "low", level: "low", desc: "应收账款周转天数升至 71 天，较上期上升 9 天，回款周期有所拉长", date: "2026-10-31" },
];
const metricTabs = [
  { key: "fin", cn: "财务分析", table: "tb_ai_financial_analysis_index", count: 59 },
  { key: "inv", cn: "票税银", table: "tb_ai_invoice_analysis_index", count: 27 },
  { key: "con", cn: "财税一致性", table: "tb_ai_financial_and_tax_report_consistency_index", count: 19 },
  { key: "alt", cn: "异常预警", table: "tb_ai_exception_alert_index", count: 40 },
];
const activeTab = ref("fin");

const finGroups = [
  { name: "盈利能力与收益质量", items: [
    { label: "净资产收益率（含少数股东权益）", v: "18.24", u: "%" }, { label: "净资产收益率（不含少数股东权益）", v: "18.06", u: "%" },
    { label: "总资产报酬率", v: "10.42", u: "%" }, { label: "销售毛利率", v: "32.60", u: "%" },
    { label: "营业利润率", v: "14.80", u: "%" }, { label: "成本费用利润率", v: "16.95", u: "%" },
    { label: "EBIT 利润率", v: "16.32", u: "%" }, { label: "盈余现金保障倍数", v: "1.42", u: "倍" },
    { label: "成本费用总额占营业总收入比率", v: "85.20", u: "%" }, { label: "主营业务毛利率", v: "33.15", u: "%" },
    { label: "主营业务净利率", v: "11.90", u: "%" }, { label: "净利润增长率", v: "21.70", u: "%" },
    { label: "资本收益率", v: "17.40", u: "%" }, { label: "主营业务成本率", v: "66.85", u: "%" },
    { label: "主营业务税金率", v: "0.92", u: "%" },
  ]},
  { name: "费用与现金流", items: [
    { label: "管理费用率", v: "8.60", u: "%" }, { label: "财务费用率", v: "1.24", u: "%" },
    { label: "销售收现比", v: "1.12", u: "" }, { label: "营运指数", v: "1.08", u: "" },
    { label: "费用增长额", v: "48.6", u: "万元" }, { label: "费用增长率", v: "8.30", u: "%" },
    { label: "费用环比数", v: "104.20", u: "%" },
  ]},
  { name: "资产与资金结构", items: [
    { label: "资金余额", v: "1,286.4", u: "万元" }, { label: "现金余额占比", v: "18.60", u: "%" },
    { label: "银行存款占比", v: "62.40", u: "%" }, { label: "待取资产", v: "86.2", u: "万元" },
    { label: "长期资产", v: "1,842.6", u: "万元" }, { label: "不良资产比率", v: "0.86", u: "%" },
    { label: "资产损失比率", v: "0.42", u: "%" }, { label: "固定资产成新率", v: "68.50", u: "%" },
  ]},
  { name: "营运能力", items: [
    { label: "总资产周转率", v: "1.32", u: "次" }, { label: "流动资产周转率", v: "2.18", u: "次" },
    { label: "存货周转率", v: "6.80", u: "次" }, { label: "应收账款周转率", v: "5.10", u: "次" },
    { label: "应付账款周转率", v: "4.60", u: "次" }, { label: "资产现金回收率", v: "12.80", u: "%" },
    { label: "应收账款增长率", v: "9.40", u: "%" }, { label: "分账期应收账款", v: "312.5", u: "万元" },
    { label: "分账期应收账款占比", v: "6.80", u: "%" }, { label: "存货增长率", v: "7.20", u: "%" },
    { label: "分期存货", v: "96.8", u: "万元" }, { label: "分期存货占比", v: "4.10", u: "%" },
  ]},
  { name: "偿债能力", items: [
    { label: "资产负债率", v: "41.30", u: "%" }, { label: "负债权益比率", v: "0.70", u: "" },
    { label: "已获利息倍数", v: "9.40", u: "倍" }, { label: "利息保障倍数", v: "9.40", u: "倍" },
    { label: "现金比率", v: "0.62", u: "" }, { label: "流动比率", v: "1.86", u: "" },
    { label: "速动比率", v: "1.42", u: "" }, { label: "现金流动负债比率", v: "0.38", u: "" },
    { label: "短期借款占全部借款的比率", v: "65.20", u: "%" }, { label: "抵押（质押）资产占总资产比率", v: "12.60", u: "%" },
    { label: "长期资产适合率", v: "118.40", u: "%" }, { label: "担保金额占净资产比率", v: "15.80", u: "%" },
    { label: "带息负债", v: "460.0", u: "万元" }, { label: "带息负债比率", v: "24.60", u: "%" },
    { label: "或有负债比率", v: "3.20", u: "%" }, { label: "产权比率", v: "0.70", u: "" },
    { label: "借款依存度", v: "22.40", u: "%" },
  ]},
];
const invGroups = [
  { name: "收入与发票（12 项）", items: [
    { label: "应税销售收入", v: "6,398.5", u: "万元" }, { label: "月均应税销售收入", v: "639.9", u: "万元" },
    { label: "有效发票金额", v: "7,031.2", u: "万元" }, { label: "有效发票税额", v: "402.7", u: "万元" },
    { label: "有效发票金额占比", v: "96.20", u: "%" }, { label: "有效发票含税金额同比", v: "18.60", u: "%" },
    { label: "有效发票含税金额环比", v: "6.20", u: "%" }, { label: "有效发票应税金额同比", v: "17.90", u: "%" },
    { label: "有效发票应税金额环比", v: "5.80", u: "%" }, { label: "有效专票发票金额", v: "5,842.6", u: "万元" },
    { label: "月均开票金额", v: "703.1", u: "万元" }, { label: "近 12 月月均应税金额在近 24 月占比", v: "58.40", u: "%" },
  ]},
  { name: "客户与交易（6 项）", items: [
    { label: "下游企业客户数量", v: "68", u: "家" }, { label: "第一大客户开票金额占比", v: "18.60", u: "%" },
    { label: "近 6 月前五大客户开票金额占比", v: "46.20", u: "%" }, { label: "企业客户平均历史交易月数", v: "26.4", u: "个月" },
    { label: "新增交易企业数量", v: "9", u: "家" }, { label: "流失交易企业数量", v: "3", u: "家" },
  ]},
  { name: "开票行为（3 项）", items: [
    { label: "有效发票开票月数", v: "12", u: "个月" }, { label: "最大开票间隔", v: "21", u: "天" },
    { label: "未开票月份数", v: "0", u: "个" },
  ]},
  { name: "资金流水（6 项）", items: [
    { label: "近 1 个月有效流入金额", v: "682.4", u: "万元" }, { label: "近 1 个月日均余额", v: "274.6", u: "万元" },
    { label: "近 6 个月有效流入金额", v: "3,986.2", u: "万元" }, { label: "近 6 个月日均余额", v: "261.8", u: "万元" },
    { label: "近 12 个月有效流入金额", v: "7,846.3", u: "万元" }, { label: "近 12 个月日均余额", v: "268.4", u: "万元" },
  ]},
  { name: "上下游结构 · TOP 榜单 · 近 12 个月" },
];
const topBoards = [
  { title: "有效流入方 TOP5", source: "银行流水", rows: [
    { name: "北京中科数智科技有限公司", v: "1,308.0 万" }, { name: "国网信通产业集团有限公司", v: "962.5 万" },
    { name: "上海云枢信息技术有限公司", v: "528.3 万" }, { name: "天津恒瑞供应链管理有限公司", v: "402.6 万" },
    { name: "深圳启明智能科技有限公司", v: "351.4 万" }]},
  { title: "有效流出方 TOP5", source: "银行流水", rows: [
    { name: "浪潮云信息技术股份公司", v: "720.4 万" }, { name: "阿里云计算有限公司", v: "486.2 万" },
    { name: "北京神州数码有限公司", v: "398.7 万" }, { name: "中电科数字技术股份有限公司", v: "302.1 万" },
    { name: "京东云计算有限公司", v: "268.9 万" }]},
  { title: "客户 TOP5", source: "有效发票金额", rows: [
    { name: "北京中科数智科技有限公司", v: "1,308.0 万" }, { name: "国网信通产业集团有限公司", v: "962.5 万" },
    { name: "上海云枢信息技术有限公司", v: "528.3 万" }, { name: "天津恒瑞供应链管理有限公司", v: "402.6 万" },
    { name: "深圳启明智能科技有限公司", v: "351.4 万" }]},
  { title: "供应商 TOP5", source: "有效发票金额", rows: [
    { name: "浪潮云信息技术股份公司", v: "720.4 万" }, { name: "阿里云计算有限公司", v: "486.2 万" },
    { name: "北京神州数码有限公司", v: "398.7 万" }, { name: "中电科数字技术股份有限公司", v: "302.1 万" },
    { name: "京东云计算有限公司", v: "268.9 万" }]},
  { title: "售卖主商品 TOP5", source: "商品总价", rows: [
    { name: "企业财务数据服务", v: "2,846.5 万" }, { name: "票税银分析 SaaS", v: "1,682.3 万" },
    { name: "数据治理实施服务", v: "968.4 万" }, { name: "系统运维服务", v: "642.8 万" },
    { name: "定制化开发服务", v: "486.2 万" }]},
  { title: "客户区域 TOP5", source: "有效发票金额", rows: [
    { name: "北京", v: "2,684.5 万" }, { name: "上海", v: "1,126.8 万" }, { name: "广东", v: "864.2 万" },
    { name: "江苏", v: "628.4 万" }, { name: "浙江", v: "486.9 万" }]},
];
const conRows = [
  { name: "流动资产", v: 98.2 }, { name: "总资产", v: 97.8 }, { name: "流动负债", v: 96.4 },
  { name: "总负债", v: 95.3 }, { name: "所有者权益", v: 94.8 }, { name: "营业收入", v: 96.4 },
  { name: "营业成本", v: 94.1 }, { name: "营业税金及附加", v: 92.6 }, { name: "销售费用", v: 90.8 },
  { name: "管理费用", v: 93.2 }, { name: "财务费用", v: 91.5 }, { name: "营业利润", v: 89.7 },
  { name: "利润总额", v: 90.3 }, { name: "所得税费用", v: 88.6 }, { name: "净利润", v: 91.2 },
  { name: "销项发票与销售收入", v: 93.6 }, { name: "进项发票与成本费用", v: 90.4 },
  { name: "银行流水收入与销项发票", v: 88.9, warn: true }, { name: "银行流水支出与进项发票", v: 87.5, warn: true },
];
const altGroups = [
  { name: "经营与税务", items: [
    { label: "营业状态是否为非正常", pill: "否" }, { label: "法定代表人是否变动或持股降至 25% 以下", pill: "否" },
    { label: "销售收入是否连续 3 个月下降", pill: "否" }, { label: "是否连续两个季度亏损", pill: "否" },
    { label: "亏损是否占销售收入 30% 以上", pill: "否" }, { label: "近 6 个月销售额为 0 的申报次数", v: "0", u: "次" },
    { label: "是否为欠税状态", pill: "否" }, { label: "近 6 个月税务处罚是否大于 2 次", pill: "否" },
    { label: "当月销售收入是否下降", pill: "否" }, { label: "销售收入是否连续 2 个月下降", pill: "否" },
    { label: "最新季度报表是否显示亏损", pill: "否" }, { label: "本期是否申报增值税", pill: "是" },
  ]},
  { name: "收入与成本", items: [
    { label: "连续 3 个月有营业收入无成本", pill: "否" }, { label: "连续 3 个月有成本无营业收入", pill: "否" },
    { label: "近 3 月 / 近 12 月平均主营收入超过 300%", pill: "否" }, { label: "近 3 月 / 近 12 月平均主营收入不足 15%", pill: "否" },
    { label: "近 6 个月主营收入环比减少 80%", pill: "否" }, { label: "近 12 个月主营收入不足 20 万元", pill: "否" },
    { label: "近 12 个月无收入月份超过 6 个月", pill: "否" }, { label: "近 3 月 / 近 12 月平均应税收入超过 300%", pill: "否" },
    { label: "近 3 月 / 近 12 月平均应税收入不足 15%", pill: "否" }, { label: "近 6 个月有效发票金额减少 80%", pill: "否" },
    { label: "近 12 个月有效发票金额不足 20 万元", pill: "否" },
  ]},
  { name: "发票行为", items: [
    { label: "连续 3 个月有销项无进项", pill: "否" }, { label: "连续 3 个月有进项无销项", pill: "否" },
    { label: "与对手互开金额超 100 万且占比不超 30%", pill: "否" }, { label: "异地进销项发票占比超过 40%", pill: "否" },
    { label: "最早有效票距今超过 12 个月", pill: "否" }, { label: "最晚开票距今超过 60 天", pill: "否" },
    { label: "近 12 个月未开票月份数小于 6", pill: "是" }, { label: "近 12 个月累计开票张数小于 35", pill: "否" },
    { label: "近 12 个月有效专票含税金额小于 0", pill: "否" }, { label: "红票占比 ≥20% 的月份有 3 个或以上", pill: "否" },
    { label: "红票占比 ≥10% 的月份有 7 个或以上", pill: "否" }, { label: "连续未开票天数大于 60 天", pill: "否" },
    { label: "近 3 月作废红冲占应税销售额超 30%", pill: "否" }, { label: "近 12 个月下游客户数小于 4", pill: "否" },
    { label: "近 12 个月红废票占应税销售额不超 50%", pill: "是" }, { label: "近 6 个月第一大客户开票占比超 95%", pill: "否" },
    { label: "近 12 个月单主体集中开票月份 2 个或以上", pill: "否" },
  ]},
];
const ipList = [
  { type: "发明专利", cls: "teal", title: "一种基于多方安全计算的企业财务数据核验方法", sub: "CN2026104782XX · 已授权", date: "2026-06-12" },
  { type: "发明专利", cls: "teal", title: "小微企业银行流水智能归类方法及系统", sub: "CN2025108934XX · 已授权", date: "2025-11-08" },
  { type: "实用新型", cls: "blue", title: "一种票据识别与财税一致性校验装置", sub: "CN2025204517XX · 已授权", date: "2025-04-21" },
];
const rdList = [
  { type: "软著", cls: "violet", title: "智云账联企业财务数据采集平台 V3.2", sub: "2026SR0345218 · 已登记", date: "2026-03-09" },
  { type: "软著", cls: "violet", title: "企业票税银一致性分析系统 V2.0", sub: "2025SR0782134 · 已登记", date: "2025-08-27" },
  { type: "资质", cls: "green", title: "高新技术企业证书", sub: "GR202411001234 · 有效期至 2027-12", date: "2024-12-06" },
  { type: "资质", cls: "green", title: "北京市专精特新中小企业", sub: "北京市经济和信息化局认定", date: "2025-05-20" },
  { type: "研发", cls: "amber", title: "研发费用加计扣除", sub: "近 3 年研发投入合计 1,486 万元，占营收 8.7%", date: "2023 - 2025" },
];
const loanRows = [
  { no: "XQ20260618002", bank: "北京银行", amt: "300 万元", term: "12 个月", rate: "3.85%", guar: "信用", status: "已放款", stCls: "ok" },
  { no: "XQ202511200018", bank: "中国建设银行", amt: "120 万元", term: "24 个月", rate: "3.95%", guar: "信用", status: "已放款", stCls: "ok" },
  { no: "XQ202609150033", bank: "交通银行", amt: "200 万元", term: "12 个月", rate: "待定", guar: "保证", status: "洽谈中", stCls: "ing" },
];
const loanTimeline = [
  { bank: "北京银行 · 2026-07-02 放款", amt: "300 万元", desc: "信用类流动资金贷款，期限 12 个月，利率 3.85%，按月付息、到期还本，目前正常履约。" },
  { bank: "中国建设银行 · 2025-12-18 放款", amt: "120 万元", desc: "税务数据贷（建行惠懂你），期限 24 个月，利率 3.95%，已按期归还 9 期。" },
  { bank: "中关村银行 · 2025-09-01 授信", amt: "100 万元", desc: "科创企业信用贷授信额度，未提用，2026-08-31 到期。" },
];
const authItems = [
  { n: "税务数据", off: false }, { n: "增值税发票", off: false }, { n: "银行流水", off: false },
  { n: "社保公积金", off: false }, { n: "电力数据", off: false }, { n: "用水数据", off: true },
  { n: "司法数据", off: false }, { n: "海关数据", off: true }, { n: "不动产登记", off: true },
];
</script>

<style scoped>
.ep-root{--ep-blue:#2f7ef3;--ep-teal:#0f9f9a;--ep-ink:#1c2b3a;--ep-sub:#5b7186;--ep-line:#e6edf5;--ep-bg:#f4f7fb;width:100%;margin:0 auto;background:var(--ep-bg);border-radius:12px;padding:0 0 8px;color:var(--ep-ink);font-size:13px;box-shadow:0 8px 30px rgba(28,43,58,.06);overflow:hidden}
@media (min-width:1440px){.ep-root{font-size:14px}}
.ep-root *{box-sizing:border-box}
.topbar{display:flex;justify-content:space-between;align-items:center;padding:14px 22px;background:#fff;border-bottom:1px solid var(--ep-line)}
.crumb{color:var(--ep-sub)} .crumb i{margin:0 6px;font-style:normal;color:#b8c6d6} .crumb b{color:var(--ep-ink)}
.top-right{display:flex;align-items:center;gap:12px}
.sync{font-size:12px;color:var(--ep-sub)}
.avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,var(--ep-blue),var(--ep-teal));color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px}
.content{padding:14px 16px 20px}
.card{background:#fff;border:1px solid var(--ep-line);border-radius:12px;padding:16px}
h1,h2,h3,h4,h5,h6,p,table{margin:0}
/* hero */
.hero{display:flex;gap:20px}
.hero-main{flex:1;min-width:0}
.hero-top{display:flex;gap:14px;align-items:flex-start}
.logo-chip{width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,var(--ep-blue),#6aa6ff);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;flex:none}
h1{font-size:20px;font-weight:700}
.badge-verified{font-size:11px;font-weight:500;color:var(--ep-teal);background:rgba(15,159,154,.1);border:1px solid rgba(15,159,154,.3);border-radius:20px;padding:2px 10px;vertical-align:3px;margin-left:6px}
.hero-meta{display:flex;align-items:center;gap:10px;color:var(--ep-sub);font-size:13px;margin-top:8px;flex-wrap:wrap}
.code{font-family:Consolas,monospace;color:var(--ep-blue)}
.copy-btn{border:1px solid var(--ep-blue);color:var(--ep-blue);background:#fff;border-radius:4px;font-size:11px;padding:1px 8px;margin-left:6px;cursor:pointer}
.sep{width:1px;height:12px;background:var(--ep-line)}
.tag-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
.tag{font-size:12px;padding:3px 10px;border-radius:6px}
.tag.blue{background:#eaf2fe;color:var(--ep-blue)} .tag.teal{background:#e6f7f6;color:#0b807c}
.tag.violet{background:#f1edfd;color:#6d4fd0} .tag.green{background:#e9f8ec;color:#1f9d55}
.tag.gray{background:#f0f3f7;color:var(--ep-sub)} .tag.amber{background:#fdf4e7;color:#c07a18}
.hero-facts{display:flex;flex-wrap:wrap;gap:0;margin-top:16px;border-top:1px dashed var(--ep-line);padding-top:14px}
.hero-facts>div{flex:1;min-width:120px;border-right:1px solid var(--ep-line);padding-right:14px;margin-right:14px;margin-bottom:8px}
.hero-facts>div:last-child{border-right:none;margin-right:0;padding-right:0}
.hero-facts label{display:block;color:var(--ep-sub);font-size:12px;margin-bottom:4px}
.hero-facts strong{font-size:18px;font-weight:700} .hero-facts strong span{font-size:12px;font-weight:400;color:var(--ep-sub);margin-left:3px}
.hero-facts strong.text{font-size:14px;line-height:1.5;display:block}
.insight{margin-top:14px;background:linear-gradient(135deg,#f4f8ff,#f0fbf9);border:1px solid #dfe9f8;border-radius:10px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start}
.ai-mark{flex:none;font-size:11px;color:#fff;background:linear-gradient(135deg,var(--ep-blue),var(--ep-teal));border-radius:4px;padding:2px 8px;margin-top:2px}
.insight p{font-size:13px;color:#3d5266;line-height:1.7}
.insight b{color:var(--ep-blue)}
.score-panel{width:250px;flex:none;border-left:1px dashed var(--ep-line);padding-left:20px}
.score-head{font-weight:600;font-size:14px} .score-head span{font-weight:400;color:var(--ep-sub);font-size:12px;margin-left:6px}
.score-ring{position:relative;width:148px;margin:12px auto 6px}
.score-center{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column}
.score-center b{font-size:36px;font-weight:700;background:linear-gradient(135deg,var(--ep-blue),var(--ep-teal));-webkit-background-clip:text;background-clip:text;color:transparent}
.score-center small{color:var(--ep-sub);font-size:12px}
.score-grade{display:flex;justify-content:center;gap:8px;margin-bottom:12px}
.grade{font-weight:700;color:var(--ep-blue);background:#eaf2fe;border-radius:6px;padding:2px 12px}
.risk-low{color:#1f9d55;background:#e9f8ec;border-radius:6px;padding:2px 12px;font-size:13px}
.score-bars>div{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:12px}
.score-bars span{width:64px;color:var(--ep-sub);flex:none}
.score-bars i{flex:1;height:6px;border-radius:3px;background:#eef3f9;display:block}
.score-bars em{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,var(--ep-blue),var(--ep-teal))}
.score-bars b{width:24px;text-align:right;font-weight:600}
/* kpi */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:12px 0}
.kpi{background:#fff;border:1px solid var(--ep-line);border-radius:12px;padding:14px 16px}
.kpi-label{font-size:12px;color:var(--ep-sub);display:block} .kpi-label i{font-style:normal;font-size:11px}
.kpi strong{display:block;font-size:22px;font-weight:700;margin-top:6px}
.kpi strong small{font-size:11px;font-weight:400;color:var(--ep-sub);margin-left:8px}
.kpi-foot{margin-top:6px;font-size:12px;color:var(--ep-sub)} .kpi-foot.up{color:#1f9d55} .kpi-foot em{font-style:normal;font-size:11px}
.kpi.warn strong{color:#c07a18}
/* anchors */
.anchor-bar{display:flex;gap:6px;background:#fff;border:1px solid var(--ep-line);border-radius:10px;padding:6px;margin-bottom:18px;position:sticky;top:0;z-index:10}
.anchor-link{flex:1;text-align:center;padding:7px 0;border-radius:7px;font-size:13px;color:var(--ep-sub);text-decoration:none}
.anchor-link.active{background:#eaf2fe;color:var(--ep-blue);font-weight:600}
.anchor-link:hover{color:var(--ep-blue)}
/* 右侧锚点导航（仅本组件内渲染，不影响其他博文） */
.side-nav{position:fixed;right:14px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:2px;padding:10px 8px;background:rgba(255,255,255,.94);backdrop-filter:blur(8px);border:1px solid var(--ep-line);border-radius:12px;box-shadow:0 8px 24px rgba(23,50,90,.10);z-index:20}
.side-item{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:7px;font-size:12px;line-height:1.2;color:var(--ep-sub);text-decoration:none;white-space:nowrap;transition:background .18s,color .18s}
.side-item i{width:6px;height:6px;border-radius:50%;background:#c6d5e6;flex:none;transition:background .18s,box-shadow .18s}
.side-item span{transition:color .18s}
.side-item:hover{background:#f2f7ff;color:var(--ep-blue)}
.side-item:hover i{background:var(--ep-blue)}
.side-item.active{background:#eaf2fe;color:var(--ep-blue);font-weight:600}
.side-item.active i{background:var(--ep-blue);box-shadow:0 0 0 3px rgba(47,126,243,.16)}
@media (max-width: 1280px){.side-nav{display:none}}
/* sections */
.block{margin-bottom:26px}
.section-head{display:flex;align-items:baseline;gap:12px;margin-bottom:12px}
.section-head h2{font-size:17px;font-weight:700;padding-left:10px;border-left:4px solid var(--ep-blue)}
.section-sub{font-size:12px;color:var(--ep-sub)}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.fin-stack{display:grid;grid-template-columns:1fr;gap:14px}
.card-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
.card-head h3{font-size:15px;font-weight:600}
.hint{font-size:12px;color:var(--ep-sub)}
.head-tools{display:flex;align-items:center;gap:12px}
.legend{display:flex;gap:12px;font-size:12px;color:var(--ep-sub)}
.l-rev::before,.l-net::before{content:"";display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:5px;vertical-align:-1px}
.l-rev::before{background:var(--ep-blue)} .l-net::before{background:var(--ep-teal)}
.seg{display:flex;border:1px solid var(--ep-line);border-radius:7px;overflow:hidden}
.seg button{border:none;background:#fff;padding:4px 12px;font-size:12px;color:var(--ep-sub);cursor:pointer}
.seg button.on{background:#eaf2fe;color:var(--ep-blue);font-weight:600}
.chart-wrap{position:relative}
.trend-svg{width:100%;height:auto;display:block}
.axis-text{font-size:10px;fill:#8ea3b8}
.chart-tip{position:absolute;pointer-events:none;background:rgba(255,255,255,.97);border:1px solid var(--ep-line);border-radius:8px;box-shadow:0 4px 16px rgba(28,43,58,.12);padding:8px 10px;opacity:0;transition:opacity .15s;min-width:150px;z-index:5}
.chart-tip.show{opacity:1}
.t-m{font-size:11px;color:var(--ep-sub);display:block;margin-bottom:4px}
.t-row{display:flex;justify-content:space-between;gap:14px;font-size:12px;margin-top:2px}
.t-row i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px}
.radar-wrap{display:flex;justify-content:center}
.radar{width:100%;max-width:360px;height:auto}
.radar-label{font-size:12px;fill:#5b7186}
.radar-value{font-size:13px;font-weight:700;fill:#2f7ef3}
.cap-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;margin-top:14px}
.cap-card{background:#fff;border:1px solid var(--ep-line);border-radius:12px;padding:14px 16px}
.cap-card h4{font-size:13px;color:var(--ep-sub);font-weight:500;display:flex;justify-content:space-between}
.cap-card h4 b{color:var(--ep-teal);font-weight:600;font-size:12px}
.cap-row{display:flex;justify-content:space-between;font-size:13px;margin-top:8px}
.cap-row span{color:var(--ep-sub)} .cap-row b{font-weight:600}
.cap-bar{height:5px;border-radius:3px;background:#eef3f9;margin-top:10px}
.cap-bar em{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,var(--ep-blue),var(--ep-teal))}
/* info grid */
.info-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:0}
.info-item{padding:10px 12px;border-bottom:1px dashed var(--ep-line);font-size:13px}
.info-item label{display:block;color:var(--ep-sub);font-size:12px;margin-bottom:4px}
.scope-box{background:#f8fafc;border:1px solid var(--ep-line);border-radius:10px;padding:14px;margin-top:14px}
.scope-box label{font-size:12px;color:var(--ep-sub)}
.scope-box p{font-size:13px;line-height:1.8;margin-top:6px;color:#3d5266}
.mini-row{display:flex;gap:12px;margin-top:14px}
.mini{flex:1;display:flex;gap:10px;align-items:center;border:1px solid var(--ep-line);border-radius:10px;padding:10px 14px}
.mini-ico{width:34px;height:34px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:14px;flex:none}
.mini-ico.teal{background:var(--ep-teal)} .mini-ico.amber{background:#e8a23c} .mini-ico.blue{background:var(--ep-blue)} .mini-ico.red{background:#e05a5a}
.mini b{font-size:16px;display:block} .mini label{font-size:11px;color:var(--ep-sub)}
/* stat tiles */
.stat-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.stat-tile{background:#f8fafc;border:1px solid var(--ep-line);border-radius:10px;padding:12px}
.stat-tile label{font-size:11px;color:var(--ep-sub);display:block;margin-bottom:6px}
.stat-tile b{font-size:16px;font-weight:700}
.stat-tile b small{font-size:11px;font-weight:400;color:var(--ep-sub);margin-left:3px}
.client-list{margin-top:16px}
.list-title{display:flex;justify-content:space-between;font-size:12px;color:var(--ep-sub);margin-bottom:8px}
.client-row{display:flex;align-items:center;gap:10px;font-size:12px;margin-top:8px}
.cname{width:150px;flex:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cbar{flex:1;height:8px;border-radius:4px;background:#eef3f9}
.cbar em{display:block;height:100%;border-radius:4px;background:linear-gradient(90deg,var(--ep-blue),#6aa6ff)}
.cval{width:120px;text-align:right;font-weight:600;flex:none}
.cval span{color:var(--ep-sub);font-weight:400;margin-left:6px;font-size:11px}
/* consist */
.consist-total{display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#f4f8ff,#f0fbf9);border-radius:10px;padding:14px 18px;margin-bottom:14px}
.ct-label{font-size:12px;color:var(--ep-sub)}
.ct-value{font-size:30px;font-weight:700;color:var(--ep-blue)}
.ct-value small{font-size:14px}
.ct-note{font-size:12px;color:#1f9d55;background:#e9f8ec;padding:3px 10px;border-radius:14px}
.prog-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:6px 24px}
.prog-row{display:flex;align-items:center;gap:10px;font-size:12px;margin-top:9px}
.prog-row>span{width:110px;flex:none;color:var(--ep-sub)}
.prog-row i{flex:1;height:7px;border-radius:4px;background:#eef3f9;display:block}
.prog-row em{display:block;height:100%;border-radius:4px;background:var(--ep-blue)}
.prog-row em.warn{background:#e8a23c}
.prog-row b{width:44px;text-align:right;font-weight:600}
/* risk */
.risk-cats{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px}
.risk-cat{border-radius:10px;padding:14px;text-align:center}
.risk-cat b{font-size:24px;display:block}
.risk-cat label{font-size:12px;color:var(--ep-sub);margin-top:2px;display:block}
.risk-cat.mid{background:#fdf4e7;color:#c07a18} .risk-cat.zero{background:#f2f5f9;color:var(--ep-sub)}
.indicator-title{font-size:13px;font-weight:600;margin:16px 0 4px}
.indicator-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.indicator{display:flex;align-items:center;gap:8px;background:#f8fafc;border:1px solid var(--ep-line);border-radius:8px;padding:8px 10px;font-size:12px}
.indicator i{width:7px;height:7px;border-radius:50%;background:#1f9d55;flex:none}
.indicator.warn i{background:#e8a23c}
.indicator span{flex:1;color:var(--ep-sub)}
.indicator b{font-weight:600}
.more-link{display:inline-block;margin-top:12px;font-size:13px;color:var(--ep-blue);text-decoration:none}
.alert-list{display:flex;flex-direction:column;gap:10px}
.alert{display:flex;gap:12px;border:1px solid var(--ep-line);border-radius:10px;padding:12px 14px;align-items:flex-start;position:relative}
.alert.high{border-left:3px solid #e05a5a;background:#fefafa}
.alert.low{border-left:3px solid #e8a23c;background:#fffdf7}
.alert .level{display:none}
.alert h5{font-size:13px;font-weight:600}
.lv{font-size:11px;border-radius:4px;padding:1px 7px;margin-left:6px;vertical-align:1px}
.lv.mid{background:#fdf4e7;color:#c07a18} .lv.low{background:#f0f3f7;color:var(--ep-sub)}
.alert p{font-size:12px;color:var(--ep-sub);margin-top:5px;line-height:1.6}
.alert .date{margin-left:auto;font-size:11px;color:#b8c6d6;flex:none}
/* metrics */
.metrics-head{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}
.metric-tabs{display:flex;gap:8px;flex-wrap:wrap}
.metric-tab{display:flex;flex-direction:column;align-items:flex-start;gap:3px;border:1px solid var(--ep-line);background:#fff;border-radius:10px;padding:10px 14px;cursor:pointer;font-size:11px;color:var(--ep-sub)}
.metric-tab i{font-style:normal;font-size:13px;font-weight:600;color:var(--ep-ink)}
.metric-tab.on{border-color:var(--ep-blue);background:#f4f8ff}
.metric-tab.on i{color:var(--ep-blue)}
.metric-tab b{color:var(--ep-blue);margin-left:4px}
.metrics-meta{font-size:12px;color:var(--ep-sub)}
.metric-panel{display:none}
.metric-panel.on{display:block}
.table-tag{font-size:12px;color:var(--ep-sub);background:#f8fafc;border:1px solid var(--ep-line);border-radius:8px;padding:8px 12px;margin:14px 0 4px}
.table-tag code{font-family:Consolas,monospace;color:var(--ep-blue);background:#eaf2fe;border-radius:4px;padding:1px 6px}
.metric-group{margin-top:16px}
.metric-group h4{font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px}
.metric-group h4 i{font-style:normal;font-weight:400;font-size:11px;color:var(--ep-sub);background:#f0f3f7;border-radius:10px;padding:1px 8px}
.metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-top:10px}
.metric-grid.three{grid-template-columns:repeat(auto-fit,minmax(200px,1fr))}
.metric{border:1px solid var(--ep-line);border-radius:8px;padding:10px 12px;background:#fdfefe}
.metric label{font-size:12px;color:var(--ep-sub);display:block;line-height:1.5;min-height:36px}
.metric b{font-size:15px;font-weight:700;margin-top:4px;display:inline-block}
.metric b small{font-size:11px;font-weight:400;color:var(--ep-sub);margin-left:2px}
.v-pill{font-size:12px;font-weight:600;border-radius:4px;padding:2px 10px;display:inline-block;margin-top:4px}
.v-pill.ok{background:#e9f8ec;color:#1f9d55}
.metrics-summary{display:flex;gap:24px;font-size:12px;color:var(--ep-sub);background:#f8fafc;border-radius:8px;padding:10px 14px;margin-top:14px}
.metrics-summary b{font-size:18px;color:var(--ep-blue);margin-right:6px}
.ok-text{color:#1f9d55}
.struct-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-top:10px}
.struct-card{border:1px solid var(--ep-line);border-radius:10px;padding:12px;background:#fdfefe}
.struct-card h5{font-size:12px;font-weight:600;display:flex;justify-content:space-between;align-items:center;border-bottom:1px dashed var(--ep-line);padding-bottom:8px;margin-bottom:6px}
.struct-card h5 span{font-weight:400;font-size:11px;color:var(--ep-sub)}
.srow{display:flex;align-items:center;gap:8px;font-size:12px;margin-top:7px}
.srow i{font-style:normal;width:16px;height:16px;border-radius:4px;background:#eaf2fe;color:var(--ep-blue);font-size:11px;display:flex;align-items:center;justify-content:center;flex:none}
.srow span{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.srow b{font-weight:600;flex:none}
.metrics-note{display:flex;gap:28px;flex-wrap:wrap;font-size:12px;color:var(--ep-sub);border-top:1px dashed var(--ep-line);margin-top:18px;padding-top:12px}
/* ip */
.ip-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:14px}
.ip-stat{background:#f8fafc;border-radius:10px;padding:14px;text-align:center}
.ip-stat b{font-size:24px;font-weight:700;color:var(--ep-blue)}
.ip-stat b small{font-size:12px;font-weight:400;margin-left:3px;color:var(--ep-sub)}
.ip-stat label{display:block;font-size:11px;color:var(--ep-sub);margin-top:4px}
.ip-row{display:flex;gap:10px;align-items:flex-start;border-top:1px dashed var(--ep-line);padding:12px 0}
.ip-row .tag{flex:none}
.ip-row h6{font-size:13px;font-weight:600}
.ip-row p{font-size:12px;color:var(--ep-sub);margin-top:3px}
.ip-date{margin-left:auto;font-size:11px;color:#b8c6d6;flex:none}
/* financing */
.overflow-x{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12px}
th{text-align:left;color:var(--ep-sub);font-weight:500;padding:8px 10px;border-bottom:1px solid var(--ep-line);white-space:nowrap}
td{padding:9px 10px;border-bottom:1px dashed var(--ep-line);white-space:nowrap}
td.num{font-weight:600}
.status{font-size:11px;border-radius:4px;padding:2px 8px}
.status.ok{background:#e9f8ec;color:#1f9d55} .status.ing{background:#fdf4e7;color:#c07a18}
.loan-summary{display:flex;gap:0;margin-top:14px;border-top:1px solid var(--ep-line);padding-top:14px}
.loan-summary>div{flex:1;text-align:center;border-right:1px solid var(--ep-line)}
.loan-summary>div:last-child{border-right:none}
.loan-summary label{display:block;font-size:11px;color:var(--ep-sub);margin-bottom:4px}
.loan-summary b{font-size:18px;font-weight:700;color:var(--ep-blue)}
.loan-summary b small{font-size:11px;font-weight:400;color:var(--ep-sub);margin-left:2px}
.timeline{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.tl-item{position:relative;border:1px solid var(--ep-line);border-left:3px solid var(--ep-blue);border-radius:10px;padding:12px 14px;background:#fdfefe;margin:0}
.tl-head{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}
.tl-head h6{font-size:13px;font-weight:600}
.tl-amt{font-size:13px;font-weight:700;color:var(--ep-blue)}
.tl-item p{font-size:12px;color:var(--ep-sub);margin-top:6px;line-height:1.6}
.auth-foot{display:flex;gap:24px;flex-wrap:wrap;font-size:12px;color:var(--ep-sub);border-top:1px dashed var(--ep-line);margin-top:16px;padding-top:12px}
.auth-foot b{color:var(--ep-ink);font-weight:600}
.green-text{color:#1f9d55}
/* auth */
.auth-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(84px,1fr));gap:10px}
.auth-item{border:1px solid var(--ep-line);background:#f4f8ff;color:var(--ep-blue);border-radius:8px;padding:12px 6px;text-align:center;font-size:12px;font-weight:600}
.auth-item.off{background:#f8fafc;color:#b8c6d6;border-style:dashed;text-decoration:line-through}
.page-foot{font-size:11px;color:#9aabbf;line-height:1.8;margin-top:8px;text-align:center}
@media (max-width: 900px){
  .anchor-bar{flex-wrap:wrap}
  .anchor-link{flex:1 1 25%}
  .hero{flex-direction:column}
  .score-panel{width:auto;border-left:none;padding-left:0;border-top:1px dashed var(--ep-line);padding-top:16px}
  .mini-row{flex-wrap:wrap}
  .mini{flex:1 1 45%}
}
@media (max-width: 600px){
  .hero-top{flex-direction:column}
  .hero-meta{font-size:12px}
  .topbar{flex-direction:column;gap:8px;align-items:flex-start}
}
</style>
