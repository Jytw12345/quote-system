// 缓存版本号（每次上传前修改此版本号，或使用日期格式如：quote-app-20240612）
const CACHE_NAME = 'V3.4.251 更新日期：20260821';

// 更新日志（每次发布新版本时更新）
const UPDATE_LOGS = [
    'fix 产品库手机端识别按钮尺寸调小：padding 0.2rem 0.4rem、font-size 0.7rem、min-height 28px、min-width 58px，与第二行收藏/卡片/归属筛选按钮更协调，避免绿色识别按钮显得过大',
    'fix 产品库手机端顶部工具栏重新布局：第一行「搜索框 + 📷识别」，第二行「收藏/卡片/归属筛选」合并横向滚动；新增 .mobile-recognize-btn 仅手机端显示，桌面端仍由 action-buttons 内识别按钮承载，保证两端体验一致',
    'fix 产品库桌面端顶部工具栏彻底修复为同一行：根因是主样式表里存在一处未闭合的 @media (max-width:576px)（约第 3086 行开始），把后面大量基础规则吞进媒体查询，导致桌面端 .scope-filter/.mobile-filter-row 等基础 flex 规则全部失效。把产品库归属筛选与 .mobile-filter-row 基础规则移到该未闭合媒体查询之前，并补 !important；桌面端搜索框限宽 420px，按钮组与归属筛选在同一 flex 行内并排；手机端规则仍留在媒体查询内，搜索框独占一行、按钮组+归属筛选合并后单行横向滚动兜底',
    'fix 产品库桌面端顶部工具栏真正排成一排：前版把搜索框限宽后，识别/收藏/视图与归属筛选仍不在同一行，因为 .mobile-filter-row 桌面端用 display:contents 未生效（浏览器/渲染差异）。改为让 .mobile-filter-row 在桌面端也作为 flex 子项与搜索框同排，内部再 flex-nowrap 容纳按钮组与归属筛选；手机端仍 width:100% 独占一行并横向滚动兜底',
    'fix 产品库桌面端顶部工具栏排版：搜索框原 flex:3 无最大宽度，导致桌面端把搜索框拉得过长、识别/收藏/视图与归属筛选被挤到下方或靠边；新增 #products .import-export 规则强制桌面端 nowrap，并把搜索框限制为 flex:0 1 420px(max-width:420px/min-width:180px)，让搜索框与右侧按钮+归属筛选在同一行整齐排列；移动端规则仍保持搜索框独占一行，不被影响',
    'feat 产品库手机端顶部工具栏合并为一行：原「识别/收藏/视图」按钮组与「归属:全部/团队/个人」筛选合并到同一行展示，外层包 .mobile-filter-row（桌面端 display:contents 透明不影响排版），手机端为单行 flex 且 overflow-x:auto 横向滚动兜底；搜索框仍独占第一行，375px+ 手机基本无需滚动、≤360px 极小屏极端情况横向滚一点',
    'feat 报价预览/列表图片优化：上传产品图时异步生成 360px JPEG 0.72 缩略图 imageThumb 并存于报价项(方案A)，预览/列表渲染经全局指纹注册表自动用缩略图替代原图 src、原图写入 data-full 仅留给 lightbox 放大查看；所有预览风格(现代/标准/经典/门头/自定义)+gallery 统一生效。新增 decoding=async 避免解码阻塞首屏 paint，预览图片单元格按 imageMaxWidth/Height 设置占位尺寸消除加载布局抖动(CLS)；老数据无 thumb 时自动回退原图，向后兼容',
    'feat 报价预览图片 lightbox 增加「上一张/下一张」切换：收集预览内全部可点图片，工具栏显示 ‹ › 与 当前/总数 计数，支持 ←/→ 方向键循环切换；同时修复 Supabase 图片 400 噪声——hydrateTeamImages 对「云端对象不存在(Object not found/400)」降级为 console.debug 并记入会话级 _missingTeamImageIds 跳过重复拉取，真实错误仍 warn',
    'feat 报价预览图片点击放大查看(lightbox)：预览内图片(非产品缩略图)可点击弹出全屏大图，支持 放大/缩小/复位 按钮、滚轮缩放、拖拽平移、点击背景或 Esc 关闭；预览图片新增 zoom-in 光标提示，与现有模板/列宽尺寸设置并存互不冲突',
    'feat 报价预览图片大小自由调节：列宽面板新增「图片最大宽/高/行高」三个独立滑块，现代风格/标准商务/经典列表/门头工程/自定义等模板的产品图片统一读取设置，不再硬编码 120×100；行高同步作用于图片单元格高度，调大后图片纵向空间自动扩展',
    'feat 导入/导出面板的原生 prompt/confirm 全部替换为自定义对话框：新增 dialog.choose(多选按钮返回Promise) 与 dialog.confirmP(Promise确认)，导入方式/团队个人归属用美观按钮选择，替换/合并与全量危险确认用自定义确认框；顺带修复 JSON 产品导入中引用未定义变量 newProducts 的既有崩溃 bug',
    'feat 导入导出面板全面对齐云端团队/个人隔离：产品/模板/客户 JSON 与 XLSX 导入均支持「团队/个人」归属选择，XLSX 导出增加归属列实现往返不丢 scope；云模式下全量数据导入增加危险确认，防止外来备份中的团队数据污染当前团队',
    'feat 导入加「导入为团队/个人」归属选择(JSON与XLSX产品导入均支持)：导入时弹窗选团队共享或个人私有，逐条写入 scope，个人导入仅同步到本人账号；fix 个人产品保存/删除不再写团队活动日志，删除也不再 markTeamItemDeleted，避免个人产品信息泄露给团队成员',
    'feat 智能计算器「智能匹配」优先查产品库(appData.products)：按名称精确/包含/相似度匹配，命中即用产品库售价(sellingPrice)填单价、成本价(costPrice)填成本，尺寸按 area→square / cubic→cubic 映射（固定价产品置 1×1 使面积×单价=总价成立）；未命中产品库才回退 smartTemplates 预设，实现计算器与产品库价格统一',
    'fix 同步/登录审查修复6项：①登出清 cloudDirty/待上传快照，换账号登录时清空本地个人集合（印章/签名/公司信息/个人产品模板/个人报价）防串号；②团队报价历史上传后 bump 团队标记 + 新增 team_quote_history Realtime 订阅，队友实时收到更新提示；③设置面板登录/注册补 saveLoginRemembered，统一两套登录入口（无复选框默认记住邮箱）；④删除另一项目残留的 app.js/styles.css；⑤清理死代码 autoSyncPaused/autoSyncFails、合并双 DOMContentLoaded 冗余初始化；⑥清空云端/移除成员时顺带清理 Storage 图片与个人数据残留',
    'feat 启动过渡态显示个性化欢迎语：showSessionRestoring 读取 localStorage 的 sbRememberedName（afterAuth 登录成功时持久化），显示「👋 欢迎回来，{名字}！正在恢复登录...」；sbRememberedName 缺失时回退读 sbRememberedEmail 取 @ 前部分；登出时清除',
    'feat 云同步区域移动端适配(≤640px)：地址+Key+保存 3列→1列堆叠；登录/注册 5列→2列；三组备份(自动下载/本地备份/云备份)横排→纵向堆叠；syncStatusInline 允许换行防溢出；成员管理权限 grid minmax 120px→100px；子卡片 padding 缩减；纯 CSS 媒体查询零 JS 改动',
    'refactor 云同步模块分区重排 + 输入框缩短：原单一绿色大面板塞了 7 类东西视觉混乱，拆成「账号（浅绿）/ 同步（浅蓝）/ 成员管理（浅黄）」三个独立子卡片；地址+Key+保存三列放一行；邮箱+密码+姓名+登录/注册五列放一行；自动下载/本地备份/云备份三组从 grid auto-fit 改 flex 横排紧凑；测试连接/清空/清理孤儿归并到工具行；成员管理 6 个权限 checkbox 由 minmax(110px) 改 minmax(120px) 桌面 6 列紧凑；零 JS 函数改动',
    'fix sbAdminRemoveMember 增加 RLS 防御：检查 res.data 是否真的删了行，若 0 行删除则弹"缺少 profiles 表的 DELETE 策略，请到 Supabase SQL Editor 重跑 supabase-schema.sql"提示，避免 RLS 静默拒绝再次发生时误报成功',
    'fix 启动期会话恢复兜底超时：initSupabaseOnLoad 的 getSession 若因云端无响应而长时间不 resolve/reject，用户会卡在"正在连接云端..."。新增 8s 定时器，超时后自动回退完整登录表单并提示"云端连接超时，可手动登录"，且用 qbSessionResolved 标志防止后续会话结果到达时重复处理',
    'fix 恢复草稿确认框遮挡登录过渡：启动同步链 initUI() 与 idbInitPromise.then 块均触发 loadDraftQuote()，确认弹窗在登录遮罩之上挡住「正在连接云端...」。启动期不再询问，改在 afterAuth 完成 supabaseLoadBoth 之后再弹，仅对成功进入主界面的用户恢复',
    'fix 启动登录过渡态落实：initSupabaseOnLoad 原无条件调用 showLoginOverlay() 先弹完整登录表单，已登录用户每次启动都先看到输入框再自动进。改为调用 showSessionRestoring() 仅显示「正在连接云端...」遮罩，getSession 取到有效会话后由 afterAuth 淡出；无会话才回退完整表单。未配置 Supabase 时仍显示表单+提示',
    'fix 全局价格定义/文化墙配置下载后界面看不到：applyTeamData 与 applyTeamDataReplace 仅把云端值写入 appData，但 UI 从 localStorage（globalPrice_* / cultureWallConfig）读取，下载未写回导致不显示。现下载合并后同步写回 localStorage（团队价格配置以下载为准）',
    'fix 团队产品库/模板库下载后仍为空：supabaseLoadTeam 组装的 payload 用复数键 products/templates/customers/photos，applyTeamData 里合并团队项的循环却用单数键 d.product/d.template 读取，这些字段不存在 → 循环直接 return，产品/模板从未被合并进本地。改为用 colMap[k] 读复数键；同时移除冗余的 customers/photos 专用分支，统一由循环处理。该 BUG 导致客户/照片能显示（有专用复数分支）、产品/模板始终空白',
    'fix 下载截断根因：team_items / team_quote_history / personal_quote_history 的 select 未分页，被 PostgREST 默认 1000 行上限砍掉尾巴（A 上传 1034 条，B 仅拉到 1000 条，客户/照片/尾部被丢）。改成分页拉取(range 1000/页+order)，下载侧三处查询全部补全分页；上传 upsert 亦分批≤1000 防增长溢出',
    'diag 同步日志新增团队项数量诊断：上传前记录「准备上传团队项 N 条（产品/模板/客户/照片）」，下载后记录「云端团队项 N 条」；team_items 查询失败(分表/列未建)时告警降级。用于定位「上传成功但另一设备下载为空」究竟是云端无数据还是下载未合并',
    'fix 团队项(产品库/客户管理/模板库/照片)下载后为空：applyTeamData 的参数被当成 {data:{...}} 包裹，实际传入的是已展开的团队数据本体，导致 !payload.data 判定为「无数据」提前 return，产品/客户/模板/照片/分类从未被合并。改为直接以本体为 payload。该 BUG 使团队项永不同步、仅团队历史报价与个人数据能跨设备同步，与现象完全吻合',
    'fix 启动期会话恢复过渡态：打开软件先显示「正在恢复登录状态...」而非完整登录表单，已登录用户不再每次看到登录界面再自动进入；确认无会话才显示登录表单',
    'fix 团队上传兼容降级：写入前探测 team_items 是否含 txn_id 列，缺失时降级不带该列仍可成功写入，避免漏跑 schema 导致团队项写入失败、云端 team_items 为空、下载拉不回数据',
    'fix 上传到云端防呆增强：本地团队项明显少于云端已知(不足一半)时弹温和警告，避免残缺/少量数据覆盖云端团队库',
    'fix 报价主图/模板图导入自动压缩(长边1200px JPEG 0.85)，减小同步报文与本地IDB/Storage体积',
    'fix 团队模板/产品图片跨设备同步后加载失败(分表后图片拉取地图断裂)，hydrateTeamImages 无地图时按本地 imageId 自动从 Storage 补齐',
    'fix 个人公司信息同步被覆盖：冲突重试/下载合并改为本地优先，云端空值不再清空本地填写',
    'fix 同步6项BUG：团队项删除同步+刷新复活、孤儿图片GC误删队友图、待上传清单重复计数、手动下载清空提醒、图片GC分页、Realtime txnId回环',
    'fix 待分配账号授权后无需退出重登：遮罩新增「我已被分配角色？点此进入」按钮，点击重试即加载团队数据',
    'fix 手机端报价保存归属面板：「保存为」与「团队/个人」选项放到同一行，提示文字另起一行',
    'revert 手机端底部操作按钮恢复原始文字（不再精简），其他团队/个人选项界面优化保留',
    'fix 手机端团队/个人选项界面优化：报价保存归属面板改为网格卡片式，产品库/模板归属筛选改为横向滚动，报价操作按钮在手机端精简文字',
    'fix 登录界面回车登录：密码/姓名框回车直接提交，账号框回车聚焦密码框',
    'fix 人员管理手机端不显示人员信息：成员卡片 flex 布局左侧被挤到 0 宽度，改为最小宽度 + 换行 + 权限 2 列网格',
    'fix 退出登录闪现主界面：授权遮罩延迟到 signOut 成功后才隐藏',
    'fix 同步区重构：个人/团队同步冲突改为弹窗抉择(覆盖云端/以云端为准/稍后)，个人数据下载不再静默覆盖未上传改动，图片按内容指纹去重避免每次同步全量上传，待上传清单纳入个人改动',
    'feat 保存即自动同步：本地保存(saveData/saveDataImmediately)后 2 秒防抖触发一次合并上传（团队+个人），含脏标记/暂停守卫/失败有限重试，避免循环与配额刷爆',
    'fix 修复编辑模板库点保存"没反应"：saveTemplate 增加 try/catch 与诊断日志，编辑按 id 找不到时降级为新建（不再静默丢失数据），同步阶段独立兜底确保 modal 必关闭',
    'fix 登录密码不再明文存localStorage：记住我仅记录邮箱，登录态交由 Supabase refresh token 维持',
    'fix 云同步乐观并发：团队数据(分类/客户/照片)按 id 合并，启用 version 字段防离线编辑被整表覆盖静默丢失',
    'fix Realtime 回环判定由 5 秒时间窗改为比对 txnId，精确识别自身写入',
    'fix 图片上传限制：单图≤5MB、单次≤50MB、并发 3；同步不再吞掉"团队保存失败"，无权限时跳过并提示',
    'fix 自动备份迁移至 IndexedDB（localStorage 兜底），突破 5MB 上限，大备份不再静默失败',
    'feat 模板库移除列表视图，统一使用卡片视图展示'
];
const basePath = self.location.pathname.replace(/sw\.js$/, '') || '/quote-system/';

self.addEventListener('install', event => {
    console.log('[SW] 开始安装新版本:', CACHE_NAME);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] 缓存资源中...');
                return cache.addAll([
                    basePath,
                    basePath + 'index.html',
                    basePath + 'manifest.json',
                    basePath + 'sw.js'
                ]);
            })
            .then(() => {
                console.log('[SW] 安装完成，等待用户确认后激活');
            })
    );
    // 不使用 skipWaiting，等待用户确认更新后再激活
});

self.addEventListener('fetch', event => {
    const request = event.request;

    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }

    if (request.url.includes('index.html')) {
        event.respondWith(
            fetch(request).then(fetchResponse => {
                const responseToCache = fetchResponse.clone();
                if (fetchResponse && fetchResponse.status === 200) {
                    return caches.open(CACHE_NAME).then(cache => {
                        return cache.put(request, responseToCache).then(() => {
                            return fetchResponse;
                        });
                    });
                }
                return fetchResponse;
            }).catch(() => {
                return caches.match(request).then(cachedResponse => {
                    if (cachedResponse) return cachedResponse;
                    return caches.match(basePath + 'index.html');
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(fetchResponse => {
                    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
                        return fetchResponse;
                    }
                    const responseToCache = fetchResponse.clone();
                    return caches.open(CACHE_NAME)
                        .then(cache => {
                            return cache.put(event.request, responseToCache).then(() => {
                                return fetchResponse;
                            });
                        });
                });
            })
            .catch(() => {
                return caches.match(basePath + 'index.html');
            })
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] 激活新版本:', CACHE_NAME);
    event.waitUntil(
        // 第一步：让新 SW 立即接管所有 client
        self.clients.claim().then(function() {
            console.log('[SW] 已接管所有客户端');
            // 第二步：删除旧缓存
            return caches.keys().then(cacheNames => {
                const deletePromises = cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => {
                        console.log('[SW] 删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    });
                return Promise.all(deletePromises);
            });
        }).then(function() {
            // 第三步：向所有客户端发送版本更新通知
            console.log('[SW] 版本更新完成，发送 VERSION_UPDATED');
            return self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    try {
                        client.postMessage({
                            type: 'VERSION_UPDATED',
                            version: CACHE_NAME,
                            logs: UPDATE_LOGS
                        });
                    } catch(e) {
                        console.log('[SW] 发送消息失败:', e);
                    }
                });
            });
        })
    );
});

// 监听来自页面的消息
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] 跳过等待，立即激活');
        event.waitUntil(self.skipWaiting());
    }
    if (event.data && event.data.type === 'ACTIVATE_UPDATE') {
        console.log('[SW] 用户确认更新，立即激活新版本');
        event.waitUntil(self.skipWaiting().then(function() {
            console.log('[SW] skipWaiting 完成，正在激活...');
        }));
    }
    if (event.data && event.data.type === 'GET_VERSION') {
        console.log('[SW] GET_VERSION 返回:', CACHE_NAME);
        event.source.postMessage({
            type: 'VERSION_RESPONSE',
            version: CACHE_NAME,
            logs: UPDATE_LOGS
        });
    }
});