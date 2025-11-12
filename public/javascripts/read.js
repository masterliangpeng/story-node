const elements = {
    ttsPlayButton: document.getElementById('ttsPlayButton'),
    ttsReplayButton: document.getElementById('ttsReplayButton'),
    storyContent: document.getElementById('storyContent'),
};

document.addEventListener('DOMContentLoaded', ()=>{
    checkSavedTheme();

    const pElementList = document.getElementById('storyContent').querySelectorAll('p');
    pElementList.forEach((p, index) => {
        setTimeout(() => {
            // 短暂延迟后显示段落
            setTimeout(() => {
                p.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                p.style.opacity = '1';
                p.style.transform = 'translateY(0)';
            }, 50);
        }, 100 * Math.min(index, 5)); // 最多延迟5段，防止过长的故事有太长的加载时间
    });

    elements.ttsPlayButton.addEventListener('click',ttsPlay);
    elements.ttsReplayButton.addEventListener('click',ttsReplay);
})

function checkSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}

// TTS语音朗读相关变量
let ttsState = {
    isPlaying: false,
    isPaused: false,
    currentUtterance: null,
    currentText: '',
    currentPosition: 0
};

// TTS播放/暂停切换
function ttsPlay() {
    if (!ttsState.currentText) {
        // 获取当前故事内容
        const storyContent = elements.storyContent;
        if (!storyContent || !storyContent.textContent.trim()) {
            showToast('没有可朗读的内容', 'warning');
            return;
        }
        ttsState.currentText = storyContent.textContent.trim();
    }

    if (ttsState.isPlaying) {
        // 当前正在播放，暂停
        ttsPause();
    } else if (ttsState.isPaused) {
        // 当前暂停中，继续播放
        ttsResume();
    } else {
        // 开始新的播放
        ttsStart();
    }
}

// 开始TTS播放
function ttsStart() {
    if (!window.speechSynthesis) {
        showToast('您的浏览器不支持语音朗读功能', 'error');
        return;
    }

    // 停止当前播放
    window.speechSynthesis.cancel();

    // 创建新的语音合成实例
    ttsState.currentUtterance = new SpeechSynthesisUtterance(ttsState.currentText);

    // 设置语音参数
    ttsState.currentUtterance.lang = 'zh-CN'; // 中文
    ttsState.currentUtterance.rate = 1; // 语速
    ttsState.currentUtterance.pitch = 1; // 音调
    ttsState.currentUtterance.volume = 1; // 音量

    // 事件监听
    ttsState.currentUtterance.onstart = () => {
        ttsState.isPlaying = true;
        ttsState.isPaused = false;
        updateTTSButton('playing');
    };

    ttsState.currentUtterance.onend = () => {
        ttsState.isPlaying = false;
        ttsState.isPaused = false;
        updateTTSButton('stopped');
    };

    ttsState.currentUtterance.onerror = (event) => {
        ttsState.isPlaying = false;
        ttsState.isPaused = false;
        updateTTSButton('stopped');
    };

    ttsState.currentUtterance.onpause = () => {
        ttsState.isPaused = true;
        updateTTSButton('paused');
    };

    ttsState.currentUtterance.onresume = () => {
        ttsState.isPaused = false;
        updateTTSButton('playing');
    };
    // 开始播放
    window.speechSynthesis.speak(ttsState.currentUtterance);
}

// 暂停TTS播放
function ttsPause() {
    if (window.speechSynthesis && ttsState.isPlaying) {
        ttsState.isPlaying = false;
        ttsState.isPaused = true;
        window.speechSynthesis.pause();
    }
}

// 恢复TTS播放
function ttsResume() {
    if (window.speechSynthesis && ttsState.isPaused) {
        ttsState.isPlaying = true;
        ttsState.isPaused = false;
        window.speechSynthesis.resume();
    }
}

// 停止TTS播放
function ttsStop() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        ttsState.isPlaying = false;
        ttsState.isPaused = false;
        updateTTSButton('stopped');
    }
}

// 重新播放
function ttsReplay() {
    ttsStop();
    setTimeout(() => {
        ttsStart();
    }, 100);
}

// 更新TTS按钮状态
function updateTTSButton(state) {
    const playButton = elements.ttsPlayButton;
    const playIcon = playButton.querySelector('.play-icon');

    switch (state) {
        case 'playing':
            playIcon.src = '/images/playstop.png';
            playIcon.alt = '暂停朗读';
            playButton.title = '暂停朗读';
            break;
        case 'paused':
            playIcon.src = '/images/play.png';
            playIcon.alt = '继续朗读';
            playButton.title = '继续朗读';
            break;
        case 'stopped':
        default:
            playIcon.src = '/images/play.png';
            playIcon.alt = '开始朗读';
            playButton.title = '开始朗读';
            break;
    }
}

// 当切换到新故事时重置TTS状态
function resetTTSState() {
    ttsStop();
    ttsState.currentText = '';
    ttsState.currentPosition = 0;
    updateTTSButton('stopped');
}
