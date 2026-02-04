/**
 * AI赋能英语速记 - 主JavaScript文件
 * 文件名：script.js
 * 依赖：data.js（数据库）、D3.js（树状图）
 */
// 树状图生成紧急修复
function debugTreeGeneration() {
    console.log('=== 树状图调试信息 ===');
    console.log('1. D3.js 状态:', typeof d3 !== 'undefined' ? '✅ 已加载' : '❌ 未加载');
    console.log('2. 数据库状态:', typeof wordDictionary !== 'undefined' ? '✅ 已加载' : '❌ 未加载');
    console.log('3. 输入框值:', document.getElementById('prefix-input')?.value);
    console.log('4. 按钮状态:', document.getElementById('generate-tree') ? '✅ 存在' : '❌ 不存在');
    

    
    // 测试生成
    if (wordDictionary && wordDictionary['im-']) {
        console.log('6. 测试数据: im- 前缀有', wordDictionary['im-'].length, '个单词');
    }
}

// 页面加载后运行调试
document.addEventListener('DOMContentLoaded', debugTreeGeneration);
// ===== 全局变量 =====
let currentPage = 'page-home';
let currentTreeData = null;

// ===== 页面导航函数 =====
function showPage(pageId) {
    // 隐藏当前页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示目标页面
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageId;
        
        // 特殊页面初始化
        if (pageId === 'page-prefix') {
            initPrefixPage();

                // 强制重设容器高度
            const container = document.getElementById('word-tree-container');
    if      (container) {
            container.style.height = '400px';
            container.style.minHeight = '400px';
            console.log('5. 容器尺寸:', container.clientWidth + 'x' + container.clientHeight);
    }
        }
    }
}

// ===== 前缀查词页面初始化 =====
function initPrefixPage() {
    // 清空之前的树状图
    d3.select("#word-tree-container").selectAll("*").remove();
    
    // 重置输入框
    document.getElementById('prefix-input').value = 'im-';
    
    // 隐藏记忆卡片
    hideMemoryCard();
    
    // 显示空状态
    const treeContainer = document.getElementById('word-tree-container');
    treeContainer.innerHTML = `
        <div class="empty-tree-message">
            <i class="fas fa-tree fa-3x"></i>
            <p>等待生成树状图...</p>
            <p>请输入前缀并点击"生成树状图"按钮</p>
        </div>
    `;
}

// ===== 树状图生成函数 =====
function generateWordTree() {
    const container = document.getElementById('word-tree-container');
    
    // 如果容器高度为0，强制设置高度
    if (container.clientHeight < 100) {
        container.style.height = '600px';
        console.log('已强制设置容器高度为600px');
    }
    const prefix = document.getElementById('prefix-input').value.trim().toLowerCase();
    
    if (!prefix) {
        showToast('请输入一个前缀（如 im-, pre-）');
        return;
    }
    
    // 检查数据库中是否有该前缀的数据
    if (!wordDictionary[prefix]) {
        showToast(`数据库中未找到前缀 "${prefix}" 的数据`);
        return;
    }
    
    // 播放转场动画（演示用）
    playTransitionAnimation();
    
    // 延迟生成树状图，让动画有显示时间
    setTimeout(() => {
        createTreeVisualization(prefix);
    }, 800);
}

// ===== 创建树状图可视化 =====
document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generate-tree');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateWordTree);
    }
});
function createTreeVisualization(prefix) {
    const container = document.getElementById('word-tree-container');
    container.innerHTML = '';
    
    const words = wordDictionary[prefix];
    if (!words || words.length === 0) {
        container.innerHTML = `
            <div class="empty-tree-message">
                <i class="fas fa-exclamation-circle fa-3x"></i>
                <p>未找到前缀 "${prefix}" 的词汇</p>
            </div>
        `;
        return;
    }
    
    // 设置树状图尺寸
    const width = container.clientWidth;
    const height = container.clientHeight || 400;
    
    // 创建SVG画布
    const svg = d3.select("#word-tree-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(100, ${height/4})`);
    
    // 创建树状布局
    const treeLayout = d3.tree()
        .size([height - 100, width - 200]);
    
    // 构建层次结构数据
    // 构建层次结构数据：确保只有一个根节点（前缀）
const rootData = [
  { word: prefix, parent: null }, // 唯一根节点
  ...words.map(word => ({ ...word, parent: prefix })) // 所有单词的父节点都是前缀
];
    const root = d3.stratify()
    .id(d => d.word)
    .parentId(d => d.parent)(rootData);
    const treeData = treeLayout(root);
    
    // 保存当前树数据，供点击事件使用
    currentTreeData = { prefix, words };
    
    // 绘制连线
    svg.selectAll(".link")
        .data(treeData.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x)
        );
    
    // 绘制节点
    const node = svg.selectAll(".node")
        .data(treeData.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .on("click", function(event, d) {
            if (d.id !== prefix) {
                showMemoryCardForWord(d.id);
            }
        });
    
    // 添加节点圆圈
    node.append("circle")
        .attr("r", d => d.id === prefix ? 12 : 8)
        .attr("class", d => d.id === prefix ? "root-node" : "word-node");
    
    // 添加节点文字
    node.append("text")
        .attr("dy", d => d.id === prefix ? -15 : 25)
        .attr("text-anchor", "middle")
        .text(d => d.id)
        .style("font-weight", d => d.id === prefix ? "bold" : "normal")
        .style("font-size", d => d.id === prefix ? "16px" : "14px");
    
    // 添加根节点特殊标记
    svg.append("text")
        .attr("x", -80)
        .attr("y", height/2)
        .attr("text-anchor", "middle")
        .text("前缀")
        .style("font-size", "12px")
        .style("fill", "#666");
}

// ===== 显示单词记忆卡片 =====
// ===== 显示单词记忆卡片 =====
async function showMemoryCardForWord(word) {
    // 1. 在所有前缀中查找单词
    let wordData = null;
    let foundPrefix = '';
    
    for (const [prefix, words] of Object.entries(wordDictionary)) {
        const found = words.find(w => w.word === word);
        if (found) {
            wordData = found;
            foundPrefix = prefix;
            break;
        }
    }
    
    if (!wordData) {
        showToast(`未找到单词 "${word}" 的详细信息`);
        return;
    }
    
}
// ===== 隐藏记忆卡片 =====
function hideMemoryCard() {
    document.getElementById('memory-card-popup').style.display = 'none';
}

// ===== 转场动画函数 =====
function playTransitionAnimation() {
    const videoContainer = document.getElementById('transition-video');
    
    // 添加动画类
    videoContainer.classList.add('playing');
    
    // 显示动画效果
    videoContainer.innerHTML = `
        <div class="animation-effect">
            <div class="spinner">
                <i class="fas fa-circle-notch fa-spin fa-3x"></i>
            </div>
            <p>正在生成词汇树状图...</p>
        </div>
    `;
    
    // 3秒后恢复原状
    setTimeout(() => {
        videoContainer.classList.remove('playing');
        videoContainer.innerHTML = `
            <div class="video-placeholder-text">
                <i class="fas fa-film fa-3x"></i>
                <p>转场动画视频占位区</p>
                <p class="file-note">可替换为：视频链接 或 static/transition.mp4</p>
                <button class="small-btn" onclick="playDemoAnimation()">播放演示动画</button>
            </div>
        `;
    }, 3000);
}

// ===== 演示动画 =====
function playDemoAnimation() {
    showToast('演示动画播放中...（实际可替换为视频）');
    
    // 这里可以添加更复杂的动画逻辑
    const demoBtn = document.querySelector('.video-container .small-btn');
    if (demoBtn) {
        demoBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 播放中...';
        demoBtn.disabled = true;
        
        setTimeout(() => {
            demoBtn.innerHTML = '播放演示动画';
            demoBtn.disabled = false;
        }, 2000);
    }
}

// ===== 显示"开发中"提示 =====
function showComingSoon(featureName) {
    showToast(`"${featureName}" 功能开发中，敬请期待！`);
}

// ===== 全局提示函数 =====
function showToast(message) {
    const toast = document.getElementById('global-toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== 页面加载完成后的初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('AI赋能英语速记系统已加载');
    
    // 绑定生成树状图按钮事件
    const generateBtn = document.getElementById('generate-tree');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateWordTree);
    }
    
    // 绑定输入框回车事件
    const prefixInput = document.getElementById('prefix-input');
    if (prefixInput) {
        prefixInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                generateWordTree();
            }
        });
    }
    
    // 初始化时显示首页
    showPage('page-home');
    
    // 检查数据库是否加载
    if (typeof wordDictionary !== 'undefined') {
        console.log('单词数据库已加载，包含前缀:', Object.keys(wordDictionary).join(', '));
    } else {
        console.error('单词数据库未正确加载');
        showToast('数据库加载失败，请刷新页面');
    }
});

// ===== 添加额外的CSS样式（用于动态效果）=====
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .playing {
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { background-color: #e8f2ff; }
            50% { background-color: #d1e5ff; }
            100% { background-color: #e8f2ff; }
        }
        
        .animation-effect {
            text-align: center;
            padding: 20px;
        }
        
        .spinner {
            margin-bottom: 15px;
            color: var(--color-primary);
        }
        
        .fa-spin {
            animation: fa-spin 1s infinite linear;
        }
        
        @keyframes fa-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .root-node {
            fill: var(--color-primary-dark);
            stroke-width: 3px;
            stroke: white;
        }
        
        .word-node:hover {
            r: 10;
            fill: var(--color-accent);
        }
    `;
    document.head.appendChild(style);
}

// 添加动态样式
addDynamicStyles();
// ===== API辅助函数 =====

/**
 * 添加加载指示器
 */
function addLoadingIndicator(word) {
    const wordElement = document.getElementById('popup-word');
    if (wordElement) {
        wordElement.innerHTML = `${word} <span class="api-loading">(加载中...)</span>`;
    }
    
    // 添加CSS样式
    if (!document.getElementById('api-styles')) {
        const style = document.createElement('style');
        style.id = 'api-styles';
        style.textContent = `
            .api-loading {
                font-size: 12px;
                color: #666;
                font-style: italic;
                margin-left: 8px;
            }
            .api-data-section {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px dashed #ddd;
            }
            .api-source {
                font-size: 11px;
                color: #888;
                font-style: italic;
                margin-top: 5px;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * 移除加载指示器
 */
function removeLoadingIndicator() {
    const loadingSpan = document.querySelector('.api-loading');
    if (loadingSpan) {
        loadingSpan.remove();
    }
}

/**
 * 填充本地数据到记忆卡片
 */
function fillMemoryCardLocal(wordData, foundPrefix) {
    document.getElementById('popup-word').textContent = wordData.word;
    document.getElementById('popup-phonetic').textContent = wordData.pronunciation;
    document.getElementById('popup-prefix').textContent = foundPrefix;
    document.getElementById('popup-root').textContent = wordData.root;
    
    // 填充释义列表
    const meaningList = document.getElementById('popup-meaning-list');
    meaningList.innerHTML = '';
    wordData.meanings.forEach(meaning => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${meaning.partOfSpeech}</strong> ${meaning.definitions.join('；')}`;
        meaningList.appendChild(li);
    });
    
    // 填充例句
    const exampleContainer = document.getElementById('popup-example');
    if (wordData.examples && wordData.examples.length > 0) {
        const example = wordData.examples[0];
        exampleContainer.innerHTML = `
            <div class="example-english">${example.sentence}</div>
            ${example.translation ? `<div class="example-chinese">${example.translation}</div>` : ''}
        `;
    } else {
        exampleContainer.innerHTML = '<div class="example-english">暂无例句</div>';
    }
}


