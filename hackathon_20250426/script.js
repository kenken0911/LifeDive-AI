// キャラクター定義
const characters = {
    'luffy': {
        name: 'ルフィ',
        inputText: 'おめぇ、明日なにするんだ？ なんかやりてぇこととか、今の気分とか教えろ！',
        buttonText: 'よし、ルフィ！明日の冒険を決めてくれ！',
        scheduleTitle: 'ルフィのスケジュール提案',
        chatTitle: '💬 ルフィと話すぞ！',
        loadingText: '考え中... 肉食いながら待ってろ！ 🍖',
        chatPlaceholder: 'ルフィに質問や相談をしよう...',
        prompt: '...'
    },
    'zoro': {
        name: 'ゾロ',
        inputText: 'ん？明日の予定か？まあ、聞いておこう。何をする気だ？',
        buttonText: 'ゾロ、こんな感じでどうだ？',
        scheduleTitle: 'ゾロのスケジュール提案',
        chatTitle: '💬 ゾロとの対話',
        loadingText: '考え中... 少し待て... 🍶',
        chatPlaceholder: 'ゾロに質問や相談をしよう...',
        prompt: '...'
    },
    'nami': {
        name: 'ナミ',
        inputText: '明日の予定を一緒に考えましょう♪ 何か予定はある？何をしたい気分？',
        buttonText: 'ナミ、明日のスケジュール考えて！',
        scheduleTitle: 'ナミのスケジュール提案',
        chatTitle: '💬 ナミとのチャット',
        loadingText: '計画中... 少し待ってね... 🍊',
        chatPlaceholder: 'ナミに質問や相談をしよう...',
        prompt: '...'
    }
};

// グローバル変数
let currentCharacter = 'luffy';
let scheduleChartInstance = null;
let currentScheduleText = ""; // スケジュールのテキスト部分
let currentScheduleJson = null; // スケジュールのJSON部分
let conversationHistory = []; // チャット履歴
const promptCache = {}; // プロンプトキャッシュ

// API設定
const API_CONFIG = {
    baseUrl: "http:******", // LiteLLM Proxyのベースエンドポイント
    //    model: "Meta-Llama-3.2-3B-Instruct", // デフォルトモデル
    model: "gemini-2.0-flash",
    // 使用可能なモデルオプション
    availableModels: [
        "gpt-4o-mini",
        "Meta-Llama-3.2-3B-Instruct",
        "Llama-4-Maverick-17B-128E-Instruct"
    ]
};

// DOM要素の参照用変数を宣言（初期値はnull）
let loadingDiv = null;
let errorDisplay = null;
let userScheduleInput = null;
let scheduleSection = null;
let scheduleOutput = null;
let chatSection = null;
let chatHistoryDiv = null;
let chatInput = null;
let getScheduleButton = null;
let sendChatButton = null;
let scheduleChartCanvas = null;
let chartErrorMsg = null;
let characterOptions = null;
let characterPrompt = null;
let buttonText = null;
let scheduleTitle = null;
let chatTitle = null;

// 動画関連の要素
let introVideo = null;
let pirateVideo = null;
let skipIntroButton = null;
let characterSelection = null;

// 完了動画関連の要素
let receiveMessageButton = null;
let finishVideoModal = null;
let finishVideo = null;
let finishVideoSource = null;
let closeModal = null;
let videoLoading = null;

// 初期化処理: ランダムなキャラクターを選択
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded');

    // DOM要素の参照を取得（DOMが確実に読み込まれた後）
    loadingDiv = document.getElementById('loading');
    errorDisplay = document.getElementById('errorDisplay');
    userScheduleInput = document.getElementById('userScheduleInput');
    scheduleSection = document.getElementById('scheduleSection');
    scheduleOutput = document.getElementById('scheduleOutput');
    chatSection = document.getElementById('chatSection');
    chatHistoryDiv = document.getElementById('chatHistory');
    chatInput = document.getElementById('chatInput');
    getScheduleButton = document.getElementById('getScheduleButton');
    sendChatButton = document.getElementById('sendChatButton');
    scheduleChartCanvas = document.getElementById('scheduleChart');
    chartErrorMsg = document.getElementById('chartError');
    characterOptions = document.querySelectorAll('.character-option');
    characterPrompt = document.getElementById('characterPrompt');
    buttonText = document.getElementById('buttonText');
    scheduleTitle = document.getElementById('scheduleTitle');
    chatTitle = document.getElementById('chatTitle');

    // 動画関連要素
    introVideo = document.getElementById('introVideo');
    pirateVideo = document.getElementById('pirateVideo');
    skipIntroButton = document.getElementById('skipIntroButton');
    characterSelection = document.getElementById('characterSelection');

    // 完了動画関連要素
    receiveMessageButton = document.getElementById('receiveMessageButton');
    finishVideoModal = document.getElementById('finishVideoModal');
    finishVideo = document.getElementById('finishVideo');
    finishVideoSource = document.getElementById('finishVideoSource');
    closeModal = document.querySelector('.close-modal');
    videoLoading = document.getElementById('videoLoading');

    console.log('DOM elements initialized:', {
        getScheduleButton: getScheduleButton,
        chatTitle: chatTitle,
        scheduleChartCanvas: scheduleChartCanvas,
        pirateVideo: pirateVideo,
        receiveMessageButton: receiveMessageButton
    });

    // 動画関連イベントリスナーの設定
    setupVideoHandlers();

    // 完了動画関連のイベントリスナーの設定
    setupFinishVideoHandlers();

    // ランダムにキャラクターを選択
    const characterKeys = Object.keys(characters);
    const randomCharacter = characterKeys[Math.floor(Math.random() * characterKeys.length)];
    selectCharacter(randomCharacter);

    // イベントリスナーを設定
    characterOptions.forEach(option => {
        option.addEventListener('click', function () {
            const character = this.dataset.character;
            selectCharacter(character);
        });
    });

    // スケジュール作成ボタンのイベントリスナー
    if (getScheduleButton) {
        getScheduleButton.addEventListener('click', getCharacterSchedule);
        console.log('Schedule button event listener set');
    } else {
        console.error("Schedule button (getScheduleButton) not found!");
    }

    // チャット送信ボタンのイベントリスナー
    if (sendChatButton) {
        sendChatButton.addEventListener('click', sendChatMessage);
    } else {
        console.error("Chat button (sendChatButton) not found!");
    }

    // Enter キーでの送信
    if (chatInput) {
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }

    if (userScheduleInput) {
        userScheduleInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                getCharacterSchedule();
            }
        });
    }
});

// 動画関連のイベントハンドラーを設定
function setupVideoHandlers() {
    // 動画関連の要素が存在するか確認
    if (!pirateVideo || !skipIntroButton || !introVideo || !characterSelection) {
        console.error('動画関連の要素が見つかりません。');
        // 要素が見つからない場合は直接キャラクター選択画面を表示
        if (characterSelection) {
            characterSelection.style.display = 'block';
        }
        if (introVideo) {
            introVideo.style.display = 'none';
        }
        return;
    }

    // 動画再生終了時のイベント
    pirateVideo.addEventListener('ended', () => {
        showCharacterSelection();
    });

    // スキップボタンクリック時のイベント
    skipIntroButton.addEventListener('click', () => {
        pirateVideo.pause(); // 動画を停止
        showCharacterSelection();
    });
}

// キャラクター選択画面を表示（アニメーション付き）
function showCharacterSelection() {
    console.log('動画紹介を終了し、キャラクター選択画面を表示します');

    // フェードアウト効果を適用
    introVideo.classList.add('fade-out');

    // アニメーション終了後に表示/非表示を切り替え
    setTimeout(() => {
        introVideo.style.display = 'none';
        characterSelection.style.display = 'block';
        characterSelection.classList.add('fade-in');
    }, 500); // フェードアウトアニメーションの長さに合わせる
}

// キャラクター選択イベントリスナーを追加
function selectCharacter(character) {
    // 以前の選択を解除
    characterOptions.forEach(option => {
        option.classList.remove('selected');
    });

    // 新しい選択に適用
    const selectedOption = document.querySelector(`.character-option[data-character="${character}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }

    // 以前のテーマを削除
    document.body.className = '';
    document.body.classList.add(`${character}-mode`);

    // UIテキストを更新
    currentCharacter = character;

    // 各要素が存在するか確認してから値を設定
    if (characterPrompt) characterPrompt.textContent = characters[character].inputText;
    if (buttonText) buttonText.textContent = characters[character].buttonText;
    if (scheduleTitle) scheduleTitle.textContent = characters[character].scheduleTitle;

    // スケジュールと会話履歴をリセット
    if (chatTitle) chatTitle.textContent = characters[character].chatTitle;
    if (loadingDiv) loadingDiv.textContent = characters[character].loadingText;
    if (chatInput) chatInput.placeholder = characters[character].chatPlaceholder;

    // アプリ状態をリセット
    resetUI();
    console.log(`キャラクター選択: ${character}`);
}

// UIをリセット
function resetUI() {
    if (scheduleSection) scheduleSection.style.display = 'none';
    if (chatSection) chatSection.style.display = 'none';
    if (scheduleChartCanvas) scheduleChartCanvas.style.display = 'none'; // Hide chart canvas
    if (chartErrorMsg) chartErrorMsg.style.display = 'none'; // Hide chart error
    if (scheduleOutput) scheduleOutput.textContent = '';
    if (chatHistoryDiv) chatHistoryDiv.innerHTML = '';
    if (errorDisplay) errorDisplay.style.display = 'none';

    // 会話履歴をクリア
    conversationHistory = [];
    currentScheduleText = "";
    currentScheduleJson = null;
    // Destroy previous chart instance if it exists
    if (scheduleChartInstance) {
        scheduleChartInstance.destroy();
        scheduleChartInstance = null;
    }
}

// プロンプトファイルを取得
async function getPromptTemplate(character) {
    try {
        console.log(`プロンプトを取得: ${character}`);

        // キャッシュがあればそれを返す
        if (promptCache[character]) {
            console.log(`キャッシュからプロンプトを返します: ${character}`);
            return promptCache[character];
        }

        // ファイルパスを構築（相対パス）
        const filePath = `./${character}/prompt.txt`;
        console.log(`プロンプトファイルのパス: ${filePath}`);

        try {
            const response = await fetch(filePath);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const promptText = await response.text();

            if (!promptText || promptText.trim() === '') {
                throw new Error('空のプロンプトファイル');
            }

            // キャッシュに保存
            promptCache[character] = promptText;
            console.log(`プロンプトをキャッシュに保存: ${character}`);

            return promptText;
        } catch (fetchError) {
            console.error(`Error loading prompt for ${character}:`, fetchError);

            // フェッチに失敗した場合はデフォルトプロンプトを使用
            const defaultPrompt = createDefaultPrompt(character);
            promptCache[character] = defaultPrompt;

            return defaultPrompt;
        }
    } catch (error) {
        console.error(`プロンプト取得中のエラー: ${error}`);
        return createDefaultPrompt(character);
    }
}

// デフォルトプロンプトの作成（ファイルが見つからない場合）
function createDefaultPrompt(character) {
    const characterData = characters[character];
    const defaultPrompt = `
あなたは「ONE PIECE」の${characterData.name}です。以下の制約に従って、ユーザーの明日のスケジュールを**詳細に**考えて提案してください。
重要な点として、提案は**自然な文章**と**JSON形式のデータ**の両方で出力してください。

# 制約
* **必ず${characterData.name}として**振る舞ってください。
* ユーザーの入力内容（予定や気分）を踏まえつつ、**${characterData.name}らしい**スケジュールを提案してください。
* **食事の時間、休憩、活動の要素**を必ず盛り込んでください。
* APIやAI、プログラムといったメタ的な発言は絶対にしないでください。あくまで${characterData.name}として話してください。

# ユーザーの入力
「\${userInput}」

# 出力形式
最初に自然な文章でスケジュールを提案し、その後に箇条書きの形式でスケジュールデータを出力してください。以下の形式です：

- **05:00–07:00** 早朝素振り （2時間）  
- **07:00–11:00** 午前の修行（〇〇） （4時間）  
- **11:00–12:00** 休憩（瞑想） （1時間）  
- **12:00–14:00** 昼食＆休息 （2時間）  
- **14:00–18:00** 午後の修行（△△） （4時間）  
- **18:00–21:00** 剣術稽古 （3時間）  
- **21:00–22:00** 休憩 （1時間）  
- **22:00–00:00** 晩飯＆ストレッチ （2時間）  
- **00:00–05:00** 睡眠 （5時間）



* "activity"には具体的な行動を記述
* "duration"はその活動の時間（単位：時間）を数値で記述
* 全ての項目の"duration"の合計が24になるように調整
`;

    promptCache[character] = defaultPrompt;
    return defaultPrompt;
}

// --- API Call Function (Reused and slightly adapted) ---
async function callBackendAPI(endpointUrl, requestBody) {
    showLoading(true);
    showError(''); // Clear previous errors

    try {
        console.log("Sending request to Backend API:", endpointUrl);
        console.log("Request Body:", JSON.stringify(requestBody)); // Log the request body

        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        console.log("Backend API Response Status:", response.status);

        if (!response.ok) {
            let errorDetail = `HTTPエラー ${response.status}`;
            let errorBodyText = await response.text();
            console.error("Backend API Error Response Text:", errorBodyText);
            try {
                const errorData = JSON.parse(errorBodyText);
                errorDetail = errorData.detail || JSON.stringify(errorData);
            } catch (e) {
                errorDetail = errorBodyText.substring(0, 500) + (errorBodyText.length > 500 ? '...' : '');
            }
            throw new Error(`APIサーバーエラー: ${errorDetail}`);
        }

        const data = await response.json();
        console.log("Backend API Success Response Body:", data);

        // Assuming the response has a 'generated_text' field
        if (!data || typeof data.generated_text !== 'string') {
            throw new Error("APIからの応答形式が無効です。'generated_text' フィールドが含まれていません。");
        }

        return data.generated_text;

    } catch (error) {
        console.error('バックエンドAPI呼び出し中にエラーが発生しました:', error);
        const displayMessage = error.message || '不明なネットワークエラーが発生しました。';
        showError(`エラー: ${displayMessage}`);
        return null; // Indicate failure
    } finally {
        showLoading(false);
    }
}

// --- Get Character's Schedule ---
async function getCharacterSchedule() {
    console.log('getCharacterSchedule called');

    // ボタンやDOM要素の存在チェック
    if (!getScheduleButton || !loadingDiv || !errorDisplay) {
        console.error("Critical DOM elements missing:", { getScheduleButton, loadingDiv, errorDisplay });
        alert('アプリの初期化に問題があります。ページをリロードしてください。');
        return;
    }

    // データ取得前の処理
    const character = currentCharacter;
    const userInput = userScheduleInput.value.trim();

    // 入力チェック
    if (!userInput) {
        showError('なんか書いてくれよな！ スケジュール作れねぇぞ！');
        return;
    }

    // Clear previous results and chat
    if (scheduleSection) scheduleSection.style.display = 'none';
    if (chatSection) chatSection.style.display = 'none';
    if (scheduleChartCanvas) scheduleChartCanvas.style.display = 'none';
    if (chartErrorMsg) chartErrorMsg.style.display = 'none';
    if (scheduleOutput) scheduleOutput.textContent = '';

    // スケジュールテーブルをクリア
    const scheduleTable = document.getElementById('scheduleTable');
    if (scheduleTable) {
        const tbody = scheduleTable.querySelector('tbody');
        if (tbody) tbody.innerHTML = '';
    }

    if (chatHistoryDiv) chatHistoryDiv.innerHTML = '';
    if (errorDisplay) errorDisplay.style.display = 'none';

    // 会話履歴をクリア
    conversationHistory = [];
    currentScheduleText = "";
    currentScheduleJson = null;

    // Destroy previous chart instance if it exists
    if (scheduleChartInstance) {
        scheduleChartInstance.destroy();
        scheduleChartInstance = null;
    }

    // Disable button during processing
    getScheduleButton.disabled = true;
    loadingDiv.style.display = 'block';

    try {
        console.log('Fetching prompt for character:', character);
        // プロンプトを取得
        const prompt = await getPromptTemplate(character);

        if (!prompt) {
            throw new Error(`${characters[character].name}のプロンプトが見つかりませんでした。`);
        }

        console.log('Prompt fetched successfully');
        const fullPrompt = `${prompt}\n\nユーザーの予定/希望:\n${userInput}\n\n上記の内容を踏まえて、指定された形式のスケジュールを生成してください。`;

        console.log('Calling API endpoint with OpenAI format...');
        // OpenAI互換フォーマットのエンドポイント
        const apiUrl = `${API_CONFIG.baseUrl}/chat/completions`;

        // OpenAI互換形式でリクエスト
        const requestBody = {
            model: API_CONFIG.model,
            messages: [
                {
                    role: "user",
                    content: fullPrompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2048
        };

        console.log('API URL:', apiUrl);
        console.log('Request body:', requestBody);

        // Call API with OpenAI format
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        console.log('API response status:', response.status);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API data received:', data);

        // OpenAI APIレスポンス形式からテキストを抽出
        let generatedText = '';
        if (data && data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            if (choice.message && choice.message.content) {
                generatedText = choice.message.content;
            }
        }

        if (!generatedText) {
            throw new Error('APIからの応答が空か無効です');
        }

        console.log('Processing API response text:', generatedText.substring(0, 100) + '...');
        // Extract and display the text portion (before JSON)
        const jsonIndex = generatedText.indexOf('```json');
        if (jsonIndex !== -1) {
            currentScheduleText = generatedText.substring(0, jsonIndex).trim();
        } else {
            currentScheduleText = generatedText;
        }

        if (scheduleOutput) scheduleOutput.textContent = currentScheduleText;
        if (scheduleSection) scheduleSection.style.display = 'block';

        // Try to extract and parse JSON for chart
        try {
            // Find JSON block between ```json and ```
            const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/);

            if (jsonMatch && jsonMatch[1]) {
                try {
                    const parsedJson = JSON.parse(jsonMatch[1]);
                    console.log("Parsed JSON:", parsedJson);

                    if (parsedJson && parsedJson.schedule && Array.isArray(parsedJson.schedule)) {
                        currentScheduleJson = parsedJson.schedule;

                        // Initialize chat with the same message
                        conversationHistory = [
                            { role: 'system', content: prompt },
                            { role: 'user', content: userInput },
                            { role: 'character', content: generatedText }
                        ];

                        // Parse data for chart
                        try {
                            if (scheduleChartCanvas) {
                                const { activities, startTimes, endTimes, durations, colors } = parseScheduleJsonForChart(currentScheduleJson);
                                if (activities.length > 0 && startTimes.length > 0) {
                                    renderChartJsTimeline(currentScheduleJson);
                                    scheduleChartCanvas.style.display = 'block';
                                    if (chartErrorMsg) chartErrorMsg.style.display = 'none';
                                } else {
                                    throw new Error("JSONデータからグラフ用のデータを抽出できませんでした。");
                                }
                            } else {
                                console.error("scheduleChartCanvas element not found");
                            }
                        } catch (chartError) {
                            console.error("Chart generation error from JSON:", chartError);
                            if (scheduleChartCanvas) scheduleChartCanvas.style.display = 'none';
                            if (chartErrorMsg) {
                                chartErrorMsg.textContent = `グラフ表示は利用できません。`;
                                chartErrorMsg.style.display = 'block';
                            }
                        }

                        // Initialize chat section with the response
                        if (chatHistoryDiv) chatHistoryDiv.innerHTML = '';
                        addMessageToChat('character', generatedText);
                        if (chatSection) chatSection.style.display = 'block';
                    } else {
                        // スケジュールデータがない場合も通常の表示を行う
                        console.warn("JSON found but doesn't contain valid schedule data");
                        showJSONlessResult(generatedText, prompt, userInput);
                    }
                } catch (parseError) {
                    // JSONパースエラー - テキストだけを表示
                    console.error("JSON parse error:", parseError);
                    showJSONlessResult(generatedText, prompt, userInput);
                }
            } else {
                // JSONが見つからない場合 - テキストだけを表示
                console.warn("No JSON block found in response");
                showJSONlessResult(generatedText, prompt, userInput);
            }
        } catch (error) {
            console.error("Schedule processing error:", error);
            // JSONパース以外のエラーはユーザーに表示しない
            showJSONlessResult(generatedText, prompt, userInput);
        }
    } catch (error) {
        console.error("API error:", error);
        // API call failed
        if (scheduleSection) scheduleSection.style.display = 'none';
        if (chatSection) chatSection.style.display = 'none';
        if (scheduleChartCanvas) scheduleChartCanvas.style.display = 'none';
        if (chartErrorMsg) chartErrorMsg.style.display = 'none';
    } finally {
        // Re-enable button
        if (getScheduleButton) getScheduleButton.disabled = false;
        if (loadingDiv) loadingDiv.style.display = 'none';
        console.log('getCharacterSchedule complete');
    }
}

// --- Send Chat Message ---
async function sendChatMessage() {
    console.log('sendChatMessage called');

    const message = chatInput.value.trim();

    if (!message || !conversationHistory || conversationHistory.length === 0) {
        return;
    }

    // Add user message to chat
    addMessageToChat('user', message);

    // Clear input
    chatInput.value = '';

    // Disable button during processing
    if (sendChatButton) sendChatButton.disabled = true;
    if (loadingDiv) loadingDiv.style.display = 'block';

    try {
        // Add to conversation history
        conversationHistory.push({ role: 'user', content: message });

        // 会話履歴をOpenAI APIフォーマットに変換
        const apiMessages = conversationHistory.map(msg => {
            // 'system', 'user', 'assistant'のいずれかにする
            let role = msg.role;
            if (role === 'character') role = 'assistant';

            return {
                role: role,
                content: msg.content
            };
        });

        // OpenAI互換APIリクエスト
        const apiUrl = `${API_CONFIG.baseUrl}/chat/completions`;
        const requestBody = {
            model: API_CONFIG.model,
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 1024
        };

        console.log('Chat API URL:', apiUrl);
        console.log('Chat request body:', requestBody);

        // Call API with OpenAI format
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        console.log('Chat API response status:', response.status);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Chat API data received:', data);

        // OpenAI APIレスポンス形式からテキストを抽出
        let responseText = '';
        if (data && data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            if (choice.message && choice.message.content) {
                responseText = choice.message.content;
            }
        }

        if (!responseText) {
            throw new Error('APIからの応答が空です');
        }

        // Add assistant response to chat and conversation
        conversationHistory.push({ role: 'character', content: responseText });
        addMessageToChat('character', responseText);
    } catch (error) {
        console.error("Chat API error:", error);
        // ユーザーフレンドリーなエラーメッセージ
        addMessageToChat('character', "すまない！今通信がうまくいかないみたいだ。もう一度話しかけてくれるか？", true);
    } finally {
        // Re-enable button
        if (sendChatButton) sendChatButton.disabled = false;
        if (loadingDiv) loadingDiv.style.display = 'none';

        // チャット履歴を最下部にスクロール
        if (chatHistoryDiv) {
            chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
        }
    }
}

// --- Chart Helper Functions ---
function parseScheduleJsonForChart(scheduleJson) {
    if (!scheduleJson || !Array.isArray(scheduleJson)) {
        throw new Error("Invalid schedule JSON format");
    }

    const activities = [];
    const startTimes = [];
    const endTimes = [];
    const durations = [];

    // Calculate start and end times for each activity
    let cumulativeHours = 0;

    // Define a base color palette based on example
    const baseColors = [
        'rgba(46, 139, 87, 0.7)',  // Green
        'rgba(255, 173, 173, 0.7)', // Light Red/Pink
        'rgba(60, 179, 113, 0.7)',  // Medium Sea Green
        'rgba(255, 165, 0, 0.7)',   // Orange
        'rgba(106, 90, 205, 0.7)',  // Slate Blue
        'rgba(70, 130, 180, 0.7)',  // Steel Blue
        'rgba(119, 136, 153, 0.7)', // Light Slate Gray
        'rgba(240, 128, 128, 0.7)', // Light Coral
        'rgba(152, 251, 152, 0.7)', // Pale Green
        'rgba(175, 238, 238, 0.7)'  // Pale Turquoise
    ];

    // First pass - collect basic data
    scheduleJson.forEach((item, index) => {
        if (item && typeof item.activity === 'string' && !isNaN(item.duration) && item.duration > 0) {
            const startTime = cumulativeHours;
            const endTime = cumulativeHours + item.duration;

            activities.push(item.activity);
            startTimes.push(startTime);
            endTimes.push(endTime);
            durations.push(item.duration);

            // Assign color
            // colors.push(baseColors[index % baseColors.length]);

            // Update cumulative hours
            cumulativeHours += item.duration;
        }
    });

    console.log("Parsed Schedule Data:", { activities, startTimes, endTimes, durations });
    return { activities, startTimes, endTimes, durations };
}

function formatTime(hours) {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function renderChartJsTimeline(scheduleData) {
    if (!scheduleChartCanvas) {
        console.error('Schedule chart canvas not found!');
        return;
    }

    // Destroy previous chart instance if it exists
    if (scheduleChartInstance) {
        scheduleChartInstance.destroy();
    }

    const ctx = scheduleChartCanvas.getContext('2d');

    const datasets = scheduleData.map((item, index) => {
        const colors = generateConsistentColors(scheduleData.map(d => d.activity));
        return {
            label: item.activity,
            data: [{
                x: [item.start, item.end],
                y: item.activity // Use activity name for the y-axis category
            }],
            backgroundColor: colors[index],
            borderColor: colors[index].replace('0.7', '1'),
            borderWidth: 1,
            barPercentage: 0.8,
            categoryPercentage: 0.7
        };
    });

    const yLabels = [...new Set(scheduleData.map(item => item.activity))];

    scheduleChartCanvas.style.display = 'block';

    scheduleChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            datasets: datasets
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const data = context.dataset.data[0];
                            const activity = context.dataset.label;
                            const start = formatTime(data.x[0]);
                            const end = formatTime(data.x[1]);
                            return `${activity}: ${start} - ${end}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: 0,
                    max: 24,
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: '時間 (Hour)'
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                y: {
                    labels: yLabels,
                    title: {
                        display: true,
                        text: 'アクティビティ'
                    }
                }
            }
        }
    });
}

function generateConsistentColors(labels) {
    const colors = [];
    const baseColors = [
        'rgba(255, 99, 132, 0.7)', // Red
        'rgba(54, 162, 235, 0.7)', // Blue
        'rgba(255, 206, 86, 0.7)', // Yellow
        'rgba(75, 192, 192, 0.7)', // Green
        'rgba(153, 102, 255, 0.7)', // Purple
        'rgba(255, 159, 64, 0.7)'  // Orange
    ];
    for (let i = 0; i < labels.length; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

// --- Other Helper Functions ---
function addMessageToChat(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message');

    if (sender === 'user') {
        messageDiv.classList.add('user-message');
    } else {
        messageDiv.classList.add('character-message');
    }

    // Convert markdown formatting (bold) to HTML
    const formattedMessage = message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');

    messageDiv.innerHTML = formattedMessage;
    chatHistoryDiv.appendChild(messageDiv);

    // Auto-scroll to bottom of chat
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

function showLoading(isLoading) {
    loadingDiv.style.display = isLoading ? 'block' : 'none';
    getScheduleButton.disabled = isLoading;
    if (sendChatButton) sendChatButton.disabled = isLoading;
}

function showError(message) {
    errorDisplay.textContent = message;
    errorDisplay.style.display = message ? 'block' : 'none';
    loadingDiv.style.display = 'none'; // 確実にローディング表示を非表示にする
}

// JSONデータ抽出とバリデーション処理の詳細なデバッグログを追加し、さらに柔軟なデータ構造処理を実装します。実際に処理しているデータの中身を可視化します。
// APIレスポンスから```jsonで囲まれたJSON部分を抽出する関数
function extractJsonFromText(text) {
    console.log('JSONを抽出します');

    // ```json と ``` で囲まれた部分を抽出するための正規表現
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = text.match(jsonRegex);

    if (match && match[1]) {
        const jsonStr = match[1].trim();
        console.log('JSON部分を発見:', jsonStr);

        // 実際のJSONの形状をより詳細に調べる
        try {
            const testObj = JSON.parse(jsonStr);
            console.log('JSONの型:', typeof testObj);
            console.log('JSONの主要なプロパティ:', Object.keys(testObj));

            if (Array.isArray(testObj)) {
                console.log('JSONは配列です。要素数:', testObj.length);
                if (testObj.length > 0) {
                    console.log('最初の要素のプロパティ:', Object.keys(testObj[0]));
                }
            }
        } catch (e) {
            console.error('JSONのテスト解析中にエラー:', e);
        }

        return jsonStr;
    }

    console.log('```json```形式のデータが見つかりませんでした。別の形式を探します...');

    // バックアッププラン: { } で囲まれたJSONを探す
    const bracesRegex = /\{[\s\S]*?\}/g;
    const bracesMatches = text.match(bracesRegex);

    if (bracesMatches && bracesMatches.length > 0) {
        console.log('{ }で囲まれた潜在的なJSONを発見:', bracesMatches.length, '個のブロック');

        // それぞれのブロックが有効なJSONか調べる
        for (const potentialJson of bracesMatches) {
            try {
                const testObj = JSON.parse(potentialJson);
                // 有効なJSONならこれを返す
                console.log('有効なJSONブロックを発見:', potentialJson);
                return potentialJson;
            } catch (e) {
                // このブロックは有効なJSONではない
                continue;
            }
        }
    }

    console.log('JSONデータが見つかりませんでした');
    return null;
}

// スケジュール作成APIのレスポンスを処理する関数
function processScheduleResponse(response) {
    console.log('スケジュールレスポンスを処理中...', response.substring(0, 100) + '...');

    // テキスト部分をそのまま表示
    document.getElementById('apiResponse').innerHTML = formatMessageWithLinks(response);

    try {
        // 新しい方法: ```json で囲まれた部分を抽出
        let jsonStr = extractJsonFromText(response);

        if (jsonStr) {
            console.log('抽出されたJSON文字列の長さ:', jsonStr.length);

            try {
                const data = JSON.parse(jsonStr);
                console.log('パースされたJSONデータの型:', typeof data);

                // JSON部分があればチャート表示
                processScheduleData(data);
            } catch (parseError) {
                console.error('JSON解析エラー:', parseError);

                // JSONの構文を修正して再試行
                console.log('JSONの構文を修正して再試行します...');
                try {
                    // シングルクォートをダブルクォートに置換
                    jsonStr = jsonStr.replace(/'/g, '"');
                    // プロパティ名の引用符がない場合に追加
                    jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

                    const repairData = JSON.parse(jsonStr);
                    console.log('修正後のJSONデータ:', repairData);
                    processScheduleData(repairData);
                } catch (repairError) {
                    console.error('JSON修復試行も失敗:', repairError);
                    showJSONlessResult();
                }
            }
        } else {
            // JSON抽出に失敗した場合、手動でスケジュールデータを抽出
            console.log('手動スケジュールデータ抽出を試みます...');
            const scheduleData = extractScheduleDataFromText(response);

            if (scheduleData && scheduleData.length > 0) {
                console.log('テキストから手動抽出したスケジュールデータ:', scheduleData);
                processScheduleData(scheduleData);
            } else {
                console.log('スケジュールデータの手動抽出にも失敗しました');
                showJSONlessResult();
            }
        }

        // チャットを有効化
        enableChat();

    } catch (error) {
        console.error('処理中のエラー:', error);
        showJSONlessResult();
    }
}

// テキストからスケジュールデータを手動で抽出する関数
function extractScheduleDataFromText(text) {
    console.log('テキストからスケジュールデータを手動抽出します');

    // 時間帯パターンの正規表現
    const timePattern = /(\d{1,2}):(\d{2})(?:\s*[-~]\s*(\d{1,2}):(\d{2}))?/g;

    // 抽出されたスケジュールデータを格納する配列
    const scheduleData = [];

    // 行ごとに処理
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 空行はスキップ
        if (!line) continue;

        // 時間が含まれる行を探す
        const timeMatches = [...line.matchAll(timePattern)];
        if (timeMatches.length > 0) {
            // 時間を含む行を見つけた
            const timeMatch = timeMatches[0];

            // 活動内容を抽出（時間の後ろの部分）
            let activityContent = line.substring(timeMatch.index + timeMatch[0].length).trim();
            if (!activityContent && i + 1 < lines.length) {
                // 活動内容が次の行にある場合
                activityContent = lines[i + 1].trim();
            }

            // 活動内容が空でなければスケジュールアイテムとして追加
            if (activityContent) {
                const startHour = parseInt(timeMatch[1]);
                const startMinute = parseInt(timeMatch[2]);

                // 終了時間がある場合
                let endHour, endMinute;
                if (timeMatch[3] && timeMatch[4]) {
                    endHour = parseInt(timeMatch[3]);
                    endMinute = parseInt(timeMatch[4]);
                } else {
                    // 終了時間がない場合は開始時間+1時間とする
                    endHour = startHour + 1;
                    endMinute = startMinute;
                }

                // ISO形式の日時文字列を作成
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth() + 1;
                const day = today.getDate();

                const startTimeStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
                const endTimeStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;

                // 所要時間を計算
                const durationHours = (endHour - startHour) + (endMinute - startMinute) / 60;

                scheduleData.push({
                    activity: activityContent,
                    start: startTimeStr,
                    end: endTimeStr,
                    duration: Math.round(durationHours * 10) / 10
                });
            }
        } else if (line.includes('時間') || line.includes('分')) {
            // 時間または分の単位が含まれる場合（例: "3時間 運動"）
            const durationMatch = line.match(/(\d+)\s*時間|(\d+)\s*分/);
            if (durationMatch) {
                // 活動内容を抽出（時間の後ろの部分）
                let activityContent = line.replace(/\d+\s*時間|\d+\s*分/, '').trim();

                // 所要時間を時間単位で計算
                let durationHours = 0;
                if (durationMatch[1]) {
                    durationHours = parseInt(durationMatch[1]);
                } else if (durationMatch[2]) {
                    durationHours = parseInt(durationMatch[2]) / 60;
                }

                scheduleData.push({
                    activity: activityContent,
                    duration: durationHours
                });
            }
        }
    }

    return scheduleData;
}

// スケジュールデータを処理する関数
function processScheduleData(data) {
    console.log('スケジュールデータを処理中:', JSON.stringify(data).substring(0, 100) + '...');

    // データの詳細なダンプ
    console.log('データ型:', typeof data);
    if (typeof data === 'object') {
        console.log('トップレベルのプロパティ:', Object.keys(data));
    }

    // データが配列かどうかをチェック
    if (Array.isArray(data)) {
        console.log('データは配列形式です。要素数:', data.length);

        // 配列が空でないかチェック
        if (data.length === 0) {
            console.log('配列が空です');
            showJSONlessResult();
            return;
        }

        // 最初の要素をサンプルとして表示
        console.log('最初の要素:', data[0]);

        // データの各要素が有効なスケジュールアイテムか確認
        const isValidSchedule = data.some(item =>
            (item.activity || item.name || item.title || item.event) &&
            (item.duration || item.length || item.time || (item.start && item.end))
        );

        if (isValidSchedule) {
            console.log('有効なスケジュールデータを検出しました');

            // データを標準形式に変換
            const standardizedData = data.map(item => ({
                activity: item.activity || item.name || item.title || item.event || '未定義の活動',
                duration: item.duration || item.length || item.time ||
                    (item.start && item.end ? calculateDuration(item.start, item.end) : 0),
                start: item.start || null,
                end: item.end || null
            }));

            console.log('標準化されたデータ:', standardizedData[0]);
            renderChartJsTimeline(standardizedData);
            return;
        } else {
            // スケジュールデータが配列内にない場合
            console.log('配列内に有効なスケジュールアイテムが見つかりません');
        }
    }
    // 配列でない場合、またはスケジュールデータでない場合
    else if (typeof data === 'object') {
        console.log('データはオブジェクト形式です');

        // スケジュールデータが直接のプロパティとして含まれているかチェック
        for (const key of ['schedule', 'schedules', 'data', 'events', 'items', 'plan', 'plans', 'activities']) {
            if (data[key] && Array.isArray(data[key])) {
                console.log(`${key}配列プロパティを検出しました`);
                return processScheduleData(data[key]);
            }
        }

        // オブジェクトの値が配列でその中にスケジュールデータがあるかチェック
        for (const key in data) {
            if (Array.isArray(data[key]) && data[key].length > 0) {
                const potentialSchedule = data[key];
                console.log(`${key}プロパティに配列データを検出しました。スケジュールデータとして処理を試みます。`);

                // この配列がスケジュールデータのように見えるかチェック
                if (potentialSchedule.some(item => typeof item === 'object')) {
                    console.log(`${key}プロパティ内の配列には少なくとも1つのオブジェクトがあります`);
                    return processScheduleData(potentialSchedule);
                }
            }
        }

        // トップレベルのオブジェクトが単一のスケジュールアイテムを表している場合
        if (data.activity || data.name || data.title || data.event) {
            console.log('単一のスケジュールアイテムとして処理します');
            return processScheduleData([data]);
        }
    }

    // ここまで来た場合、有効なスケジュールデータが見つからなかった
    console.log('JSON found but doesn\'t contain valid schedule data');
    showJSONlessResult();
}

// --- 完了動画関連のイベントハンドラーを設定 ---
function setupFinishVideoHandlers() {
    // 要素のチェック
    if (!receiveMessageButton || !finishVideoModal || !finishVideo || !finishVideoSource || !closeModal || !videoLoading) {
        console.error('完了動画関連の要素が見つかりません。');
        return;
    }

    // 「メッセージを受け取る」ボタンのクリックイベント
    receiveMessageButton.addEventListener('click', () => {
        showFinishVideo();
    });

    // モーダルを閉じるボタンのクリックイベント
    closeModal.addEventListener('click', () => {
        closeFinishVideoModal();
    });

    // モーダルの外側をクリックした場合も閉じる
    window.addEventListener('click', (event) => {
        if (event.target === finishVideoModal) {
            closeFinishVideoModal();
        }
    });
}

// 完了動画を表示する関数
function showFinishVideo() {
    if (!finishVideoModal || !finishVideo || !finishVideoSource || !videoLoading) return;

    // まずモーダルを表示して、ローディングを表示
    finishVideoModal.style.display = 'block';

    // 動画コンテナを一時的に非表示に
    const videoContainer = document.querySelector('.finish-video-container');
    if (videoContainer) {
        videoContainer.style.display = 'none';
    }

    // ローディング表示
    videoLoading.style.display = 'flex';

    // 現在選択中のキャラクターの完了動画のパスを設定
    const videoPath = `./${currentCharacter}/finish.mp4`;
    console.log(`完了動画を読み込み中: ${videoPath}`);

    // 動画ソースを設定
    finishVideoSource.src = videoPath;

    // 動画を再読み込み
    finishVideo.load();

    // エラーハンドリングを追加
    finishVideo.onerror = function () {
        console.error(`動画ロードエラー: ${videoPath}`);
        videoLoading.style.display = 'none';
        alert(`申し訳ありません。${characters[currentCharacter].name}からのメッセージを再生できませんでした。`);
        closeFinishVideoModal();
    };

    // 動画が読み込まれたときの処理を事前に設定
    finishVideo.oncanplay = function () {
        console.log('動画が正常に読み込まれました - 再生待機中');
    };

    // 最低1秒のローディング表示を保証
    setTimeout(function () {
        // ローディング表示を非表示に
        videoLoading.style.display = 'none';

        // 動画コンテナを表示
        if (videoContainer) {
            videoContainer.style.display = 'block';
        }

        // 動画を再生
        console.log('ローディング完了、動画再生開始');
        finishVideo.play().catch(error => {
            console.error('動画再生エラー:', error);
        });
    }, 1000); // 1秒に短縮
}

// 完了動画モーダルを閉じる関数
function closeFinishVideoModal() {
    if (!finishVideoModal || !finishVideo) return;

    // 動画を一時停止
    finishVideo.pause();

    // モーダルを非表示
    finishVideoModal.style.display = 'none';

    // 動画のソースをクリア
    finishVideoSource.src = '';
    finishVideo.load();
}

// JSONデータを整形してテーブル表示する関数
function renderScheduleTable(scheduleData) {
    // テーブル要素を取得
    const scheduleTable = document.getElementById('scheduleTable');
    if (!scheduleTable) {
        console.error('スケジュールテーブル要素が見つかりません');
        return;
    }

    // テーブルボディを取得
    const tbody = scheduleTable.querySelector('tbody');
    if (!tbody) {
        console.error('テーブルボディ要素が見つかりません');
        return;
    }

    // テーブルボディをクリア
    tbody.innerHTML = '';

    // スケジュールデータをソート（開始時間順）
    const sortedSchedule = [...scheduleData].sort((a, b) => {
        const startA = a.start ? new Date(a.start) : null;
        const startB = b.start ? new Date(b.start) : null;

        if (!startA && !startB) return 0;
        if (!startA) return 1;
        if (!startB) return -1;

        return startA - startB;
    });

    // スケジュールデータを行として追加
    sortedSchedule.forEach(item => {
        const row = document.createElement('tr');

        // 時間列
        const timeCell = document.createElement('td');
        timeCell.className = 'time-column';

        if (item.start && item.end) {
            // ISO形式から日本時間の表示形式に変換
            const startTime = formatDateTimeForDisplay(item.start);
            const endTime = formatDateTimeForDisplay(item.end);
            timeCell.textContent = `${startTime} - ${endTime}`;
        } else {
            timeCell.textContent = '時間未設定';
        }

        // 活動内容列
        const activityCell = document.createElement('td');
        activityCell.textContent = item.activity || '未定義の活動';

        // 所要時間列
        const durationCell = document.createElement('td');
        durationCell.className = 'duration-column';
        durationCell.textContent = item.duration ? `${item.duration} 時間` : '不明';

        // 行に各セルを追加
        row.appendChild(timeCell);
        row.appendChild(activityCell);
        row.appendChild(durationCell);

        // テーブルに行を追加
        tbody.appendChild(row);
    });

    // テーブルコンテナを表示
    const tableContainer = document.getElementById('scheduleTableContainer');
    if (tableContainer) {
        tableContainer.style.display = 'block';
    }
}

// ISO形式の日時を読みやすい形式に変換
function formatDateTimeForDisplay(isoString) {
    try {
        const date = new Date(isoString);

        // 時間と分を取得
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        // 時間のみの形式で返す（例: 08:30）
        return `${hours}:${minutes}`;
    } catch (error) {
        console.error('日時変換エラー:', error);
        return '不明';
    }
}

// --- Schedule Chart Rendering with Chart.js ---
function renderChartJsTimeline(scheduleData) {
    console.log('Rendering Chart.js timeline with data:', scheduleData);
    const canvas = document.getElementById('scheduleChart');

    if (!canvas) {
        console.error('Canvas element for chart not found!');
        return;
    }

    // 既存のチャートがあれば破棄
    if (scheduleChartInstance) {
        scheduleChartInstance.destroy();
    }

    // スケジュールデータをチャート用に解析
    const { activities, startTimes, endTimes, durations } = parseScheduleJsonForChart(scheduleData);

    // 解析したデータを使ってテーブル表示を更新
    renderScheduleTable(scheduleData);

    // Chart.jsデータセット
    const datasets = [];

    for (let i = 0; i < activities.length; i++) {
        if (startTimes[i] !== null && endTimes[i] !== null) {
            datasets.push({
                label: activities[i],
                data: [{
                    x: [startTimes[i], endTimes[i]],
                    y: activities[i]
                }],
                backgroundColor: generateConsistentColors(activities)[i],
                borderColor: generateConsistentColors(activities)[i],
                borderWidth: 1,
                borderSkipped: false,
                barPercentage: 0.8
            });
        }
    }

    // チャートオプション
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                min: 0,
                max: 24,
                title: {
                    display: true,
                    text: '時間'
                },
                ticks: {
                    callback: function (value) {
                        return `${value}:00`;
                    },
                    stepSize: 1
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    display: false
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    title: function (context) {
                        const item = context[0];
                        const index = item.datasetIndex;
                        const dataItem = scheduleData[index];

                        let timeInfo = '';
                        if (dataItem && dataItem.start && dataItem.end) {
                            const startTime = formatDateTimeForDisplay(dataItem.start);
                            const endTime = formatDateTimeForDisplay(dataItem.end);
                            timeInfo = `${startTime} - ${endTime}`;
                        }

                        return `${activities[index]} (${timeInfo})`;
                    },
                    label: function (context) {
                        const index = context.datasetIndex;
                        return `所要時間: ${durations[index]}時間`;
                    }
                }
            }
        }
    };

    // チャートの作成
    scheduleChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            datasets: datasets
        },
        options: options
    });

    console.log('Chart rendered successfully');
}

// APIレスポンスから```jsonで囲まれたJSON部分を抽出する関数
function extractJsonFromText(text) {
    console.log('JSONを抽出します。テキスト長:', text.length);

    // ```json と ``` で囲まれた部分を抽出するための単純化した方法
    const jsonStartTag = '```json';
    const jsonEndTag = '```';

    const startIndex = text.indexOf(jsonStartTag);
    if (startIndex === -1) {
        console.log('```json タグが見つかりません');
        return null;
    }

    const contentStartIndex = startIndex + jsonStartTag.length;
    const endIndex = text.indexOf(jsonEndTag, contentStartIndex);

    if (endIndex === -1) {
        console.log('終了タグ ``` が見つかりません');
        return null;
    }

    const jsonContent = text.substring(contentStartIndex, endIndex).trim();
    console.log('JSON抽出成功! 長さ:', jsonContent.length);
    console.log('抽出されたJSON:', jsonContent.substring(0, 100) + '...');

    return jsonContent;
}

// スケジュール作成APIのレスポンスを処理する関数
function processScheduleResponse(response) {
    console.log('スケジュールレスポンスを処理中...', response.substring(0, 50) + '...');

    // テキスト部分をそのまま表示
    document.getElementById('apiResponse').innerHTML = formatMessageWithLinks(response);

    try {
        // JSONを抽出
        let jsonStr = extractJsonFromText(response);

        if (jsonStr) {
            console.log('JSONの処理を開始...');

            try {
                // JSONデータをパース
                const data = JSON.parse(jsonStr);
                console.log('JSONパース成功:', typeof data);

                if (Array.isArray(data)) {
                    console.log('JSONは配列です。要素数:', data.length);
                    if (data.length > 0) {
                        console.log('最初の要素:', JSON.stringify(data[0]));
                    }
                } else {
                    console.log('JSONは配列ではありません。型:', typeof data);
                }

                // スケジュールデータとして処理
                processJsonScheduleData(data);
            } catch (parseError) {
                console.error('JSON解析エラー:', parseError);

                // JSONの構文エラーがある場合、修復を試みる
                try {
                    // シングルクォートをダブルクォートに置換するなどの修復
                    jsonStr = jsonStr.replace(/'/g, '"');
                    jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

                    const repairData = JSON.parse(jsonStr);
                    console.log('修復後のJSONパース成功');
                    processJsonScheduleData(repairData);
                } catch (repairError) {
                    console.error('JSON修復にも失敗:', repairError);
                    showJSONlessResult();
                }
            }
        } else {
            console.log('JSON抽出に失敗。手動抽出を試みます...');
            const scheduleData = extractScheduleDataFromText(response);

            if (scheduleData && scheduleData.length > 0) {
                console.log('テキストから抽出に成功:', scheduleData.length, '件のスケジュール');
                processJsonScheduleData(scheduleData);
            } else {
                console.log('全ての抽出方法が失敗しました。テキストのみ表示します。');
                showJSONlessResult();
            }
        }

        // チャットを有効化
        enableChat();

    } catch (error) {
        console.error('予期せぬエラー:', error);
        showJSONlessResult();
    }
}

// JSONデータをスケジュールデータとして処理する関数（単純化版）
function processJsonScheduleData(data) {
    console.log('JSONデータをスケジュールデータとして処理中...');

    // データが配列かどうかをチェック
    if (Array.isArray(data)) {
        // 配列要素をチェック
        if (data.length === 0) {
            console.log('配列が空です');
            showJSONlessResult();
            return;
        }

        // 各要素がスケジュールアイテムとして有効かチェック
        const validItems = data.filter(item =>
            typeof item === 'object' && item !== null &&
            (item.activity || item.name || item.title || item.event)
        );

        if (validItems.length > 0) {
            console.log('有効なスケジュールアイテムを検出:', validItems.length, '件');

            // 標準形式に変換
            const standardizedData = validItems.map(item => ({
                activity: item.activity || item.name || item.title || item.event || '未定義の活動',
                duration: item.duration || item.length || item.time ||
                    (item.start && item.end ? calculateDuration(item.start, item.end) : 1),
                start: item.start || null,
                end: item.end || null
            }));

            console.log('標準化されたデータ:', standardizedData.length, '件');
            renderChartJsTimeline(standardizedData);
            return;
        } else {
            console.log('有効なスケジュールアイテムが見つかりません');
        }
    }
    // オブジェクトの場合
    else if (data && typeof data === 'object') {
        console.log('データはオブジェクトです');

        // スケジュールデータが含まれている可能性のあるプロパティ
        const possibleArrayProps = ['schedule', 'schedules', 'data', 'events', 'items', 'plan', 'plans', 'activities'];

        for (const prop of possibleArrayProps) {
            if (data[prop] && Array.isArray(data[prop])) {
                console.log(`${prop}プロパティに配列を発見:`, data[prop].length, '件');
                return processJsonScheduleData(data[prop]);
            }
        }

        // オブジェクト自体が単一のスケジュールアイテムの場合
        if (data.activity || data.name || data.title || data.event) {
            console.log('単一のスケジュールアイテムを検出');
            return processJsonScheduleData([data]);
        }

        // その他のオブジェクトのプロパティ内に配列がないか探す
        for (const key in data) {
            if (Array.isArray(data[key]) && data[key].length > 0) {
                console.log(`${key}プロパティに配列を発見:`, data[key].length, '件');
                return processJsonScheduleData(data[key]);
            }
        }
    }

    console.log('有効なスケジュールデータが見つかりませんでした');
    showJSONlessResult();
}

// 開始時間と終了時間から所要時間（時間単位）を計算する関数
function calculateDuration(start, end) {
    try {
        const startTime = new Date(start);
        const endTime = new Date(end);
        const durationMs = endTime - startTime;
        return Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10; // 小数点第1位まで丸める
    } catch (error) {
        console.error('所要時間計算エラー:', error);
        return 0;
    }
}

// スケジュールJSONをチャート用にパースする関数
function parseScheduleJsonForChart(scheduleData) {
    // 念のためnullまたは配列でない場合のチェック
    if (!scheduleData || !Array.isArray(scheduleData)) {
        console.error('無効なスケジュールデータ:', scheduleData);
        return { activities: [], startTimes: [], endTimes: [], durations: [] };
    }

    const activities = [];
    const startTimes = [];
    const endTimes = [];
    const durations = [];

    scheduleData.forEach(item => {
        // アクティビティ名（複数の可能性のあるプロパティから取得）
        const activityName = item.activity || item.name || item.title || item.event || '未定義の活動';
        activities.push(activityName);

        // 時間情報の処理
        if (item.start && item.end) {
            try {
                // ISO形式の日時文字列を解析
                const startDate = new Date(item.start);
                const endDate = new Date(item.end);

                // 時間部分のみを取得（0-24の範囲で）
                const startHour = startDate.getHours() + startDate.getMinutes() / 60;
                const endHour = endDate.getHours() + endDate.getMinutes() / 60;

                startTimes.push(startHour);
                endTimes.push(endHour);
            } catch (e) {
                console.error('日時解析エラー:', e);
                startTimes.push(null);
                endTimes.push(null);
            }
        } else {
            startTimes.push(null);
            endTimes.push(null);
        }

        // 所要時間（複数の可能性のあるプロパティから取得）
        durations.push(item.duration || item.length || item.time || 0);
    });

    return { activities, startTimes, endTimes, durations };
}

// --- Schedule Chart Rendering with Chart.js ---
function renderChartJsTimeline(scheduleData) {
    console.log('Rendering Chart.js timeline with data:', scheduleData);
    const canvas = document.getElementById('scheduleChart');

    if (!canvas) {
        console.error('Canvas element for chart not found!');
        return;
    }

    // 既存のチャートがあれば破棄
    if (scheduleChartInstance) {
        scheduleChartInstance.destroy();
    }

    // スケジュールデータをチャート用に解析
    const { activities, startTimes, endTimes, durations } = parseScheduleJsonForChart(scheduleData);

    // 解析したデータを使ってテーブル表示を更新
    renderScheduleTable(scheduleData);

    // Chart.jsデータセット
    const datasets = [];

    for (let i = 0; i < activities.length; i++) {
        if (startTimes[i] !== null && endTimes[i] !== null) {
            datasets.push({
                label: activities[i],
                data: [{
                    x: [startTimes[i], endTimes[i]],
                    y: activities[i]
                }],
                backgroundColor: generateConsistentColors(activities)[i],
                borderColor: generateConsistentColors(activities)[i],
                borderWidth: 1,
                borderSkipped: false,
                barPercentage: 0.8
            });
        }
    }

    // チャートオプション
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                min: 0,
                max: 24,
                title: {
                    display: true,
                    text: '時間'
                },
                ticks: {
                    callback: function (value) {
                        return `${value}:00`;
                    },
                    stepSize: 1
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    display: false
                }
            }
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    title: function (context) {
                        const item = context[0];
                        const index = item.datasetIndex;
                        const dataItem = scheduleData[index];

                        let timeInfo = '';
                        if (dataItem && dataItem.start && dataItem.end) {
                            const startTime = formatDateTimeForDisplay(dataItem.start);
                            const endTime = formatDateTimeForDisplay(dataItem.end);
                            timeInfo = `${startTime} - ${endTime}`;
                        }

                        return `${activities[index]} (${timeInfo})`;
                    },
                    label: function (context) {
                        const index = context.datasetIndex;
                        return `所要時間: ${durations[index]}時間`;
                    }
                }
            }
        }
    };

    // チャートの作成
    scheduleChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            datasets: datasets
        },
        options: options
    });

    console.log('Chart rendered successfully');
}

// APIレスポンスから```jsonで囲まれたJSON部分を抽出する関数
function extractJsonFromText(text) {
    console.log('JSONを抽出します。テキスト長:', text.length);

    // ```json と ``` で囲まれた部分を抽出するための単純化した方法
    const jsonStartTag = '```json';
    const jsonEndTag = '```';

    const startIndex = text.indexOf(jsonStartTag);
    if (startIndex === -1) {
        console.log('```json タグが見つかりません');
        return null;
    }

    const contentStartIndex = startIndex + jsonStartTag.length;
    const endIndex = text.indexOf(jsonEndTag, contentStartIndex);

    if (endIndex === -1) {
        console.log('終了タグ ``` が見つかりません');
        return null;
    }

    const jsonContent = text.substring(contentStartIndex, endIndex).trim();
    console.log('JSON抽出成功! 長さ:', jsonContent.length);
    console.log('抽出されたJSON:', jsonContent.substring(0, 100) + '...');

    return jsonContent;
}

// スケジュール作成APIのレスポンスを処理する関数
function processScheduleResponse(response) {
    console.log('スケジュールレスポンスを処理中...', response.substring(0, 50) + '...');

    // テキスト部分をそのまま表示
    document.getElementById('apiResponse').innerHTML = formatMessageWithLinks(response);

    try {
        // JSONを抽出
        let jsonStr = extractJsonFromText(response);

        if (jsonStr) {
            console.log('JSONの処理を開始...');

            try {
                // JSONデータをパース
                const data = JSON.parse(jsonStr);
                console.log('JSONパース成功:', typeof data);

                if (Array.isArray(data)) {
                    console.log('JSONは配列です。要素数:', data.length);
                    if (data.length > 0) {
                        console.log('最初の要素:', JSON.stringify(data[0]));
                    }
                } else {
                    console.log('JSONは配列ではありません。型:', typeof data);
                }

                // スケジュールデータとして処理
                processJsonScheduleData(data);
            } catch (parseError) {
                console.error('JSON解析エラー:', parseError);

                // JSONの構文エラーがある場合、修復を試みる
                try {
                    // シングルクォートをダブルクォートに置換するなどの修復
                    jsonStr = jsonStr.replace(/'/g, '"');
                    jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

                    const repairData = JSON.parse(jsonStr);
                    console.log('修復後のJSONパース成功');
                    processJsonScheduleData(repairData);
                } catch (repairError) {
                    console.error('JSON修復にも失敗:', repairError);
                    showJSONlessResult();
                }
            }
        } else {
            console.log('JSON抽出に失敗。手動抽出を試みます...');
            const scheduleData = extractScheduleDataFromText(response);

            if (scheduleData && scheduleData.length > 0) {
                console.log('テキストから抽出に成功:', scheduleData.length, '件のスケジュール');
                processJsonScheduleData(scheduleData);
            } else {
                console.log('全ての抽出方法が失敗しました。テキストのみ表示します。');
                showJSONlessResult();
            }
        }

        // チャットを有効化
        enableChat();

    } catch (error) {
        console.error('予期せぬエラー:', error);
        showJSONlessResult();
    }
}

// JSONデータをスケジュールデータとして処理する関数（単純化版）
function processJsonScheduleData(data) {
    console.log('JSONデータをスケジュールデータとして処理中...');

    // データが配列かどうかをチェック
    if (Array.isArray(data)) {
        // 配列要素をチェック
        if (data.length === 0) {
            console.log('配列が空です');
            showJSONlessResult();
            return;
        }

        // 各要素がスケジュールアイテムとして有効かチェック
        const validItems = data.filter(item =>
            typeof item === 'object' && item !== null &&
            (item.activity || item.name || item.title || item.event)
        );

        if (validItems.length > 0) {
            console.log('有効なスケジュールアイテムを検出:', validItems.length, '件');

            // 標準形式に変換
            const standardizedData = validItems.map(item => ({
                activity: item.activity || item.name || item.title || item.event || '未定義の活動',
                duration: item.duration || item.length || item.time ||
                    (item.start && item.end ? calculateDuration(item.start, item.end) : 1),
                start: item.start || null,
                end: item.end || null
            }));

            console.log('標準化されたデータ:', standardizedData.length, '件');
            renderChartJsTimeline(standardizedData);
            return;
        } else {
            console.log('有効なスケジュールアイテムが見つかりません');
        }
    }
    // オブジェクトの場合
    else if (data && typeof data === 'object') {
        console.log('データはオブジェクトです');

        // スケジュールデータが含まれている可能性のあるプロパティ
        const possibleArrayProps = ['schedule', 'schedules', 'data', 'events', 'items', 'plan', 'plans', 'activities'];

        for (const prop of possibleArrayProps) {
            if (data[prop] && Array.isArray(data[prop])) {
                console.log(`${prop}プロパティに配列を発見:`, data[prop].length, '件');
                return processJsonScheduleData(data[prop]);
            }
        }

        // オブジェクト自体が単一のスケジュールアイテムの場合
        if (data.activity || data.name || data.title || data.event) {
            console.log('単一のスケジュールアイテムを検出');
            return processJsonScheduleData([data]);
        }

        // その他のオブジェクトのプロパティ内に配列がないか探す
        for (const key in data) {
            if (Array.isArray(data[key]) && data[key].length > 0) {
                console.log(`${key}プロパティに配列を発見:`, data[key].length, '件');
                return processJsonScheduleData(data[key]);
            }
        }
    }

    console.log('有効なスケジュールデータが見つかりませんでした');
    showJSONlessResult();
}

// JSONがない場合やJSONパースエラー時に、テキスト表示とチャットを有効にする関数
function showJSONlessResult(text) {
    console.log('JSONデータなしでテキストのみを表示します');

    // グラフは表示しない
    if (scheduleChartCanvas) scheduleChartCanvas.style.display = 'none';
    if (chartErrorMsg) {
        chartErrorMsg.textContent = "スケジュールの視覚化は利用できません。";
        chartErrorMsg.style.display = 'block';
    }

    // テーブルは表示しない
    const tableContainer = document.getElementById('scheduleTableContainer');
    if (tableContainer) {
        tableContainer.style.display = 'none';
    }

    // テキスト表示とチャットは有効化
    conversationHistory = [
        { role: 'character', content: text }
    ];

    // チャット履歴をクリアして表示
    if (chatHistoryDiv) chatHistoryDiv.innerHTML = '';
    addMessageToChat('character', text);
    if (chatSection) chatSection.style.display = 'block';
}

// JSON抽出処理の簡易版
function extractJsonFromText(text) {
    console.log('JSONを抽出します。テキスト長:', text.length);

    // ```json と ``` で囲まれた部分を抽出するための単純化した方法
    const jsonStartTag = '```json';
    const jsonEndTag = '```';

    const startIndex = text.indexOf(jsonStartTag);
    if (startIndex === -1) {
        console.log('```json タグが見つかりません');
        return null;
    }

    const contentStartIndex = startIndex + jsonStartTag.length;
    const endIndex = text.indexOf(jsonEndTag, contentStartIndex);

    if (endIndex === -1) {
        console.log('終了タグ ``` が見つかりません');
        return null;
    }

    const jsonContent = text.substring(contentStartIndex, endIndex).trim();
    console.log('JSON抽出成功! 長さ:', jsonContent.length);
    console.log('抽出されたJSON:', jsonContent.substring(0, 100) + '...');

    try {
        // 事前検証: JSONとして解析可能か確認
        JSON.parse(jsonContent);
        return jsonContent;
    } catch (error) {
        console.log('抽出されたデータはJSON形式として無効です。修復を試みます...');

        // JSON修復を試みる
        try {
            // 文字列リテラルの修正
            let fixedJson = jsonContent
                .replace(/'/g, '"')  // シングルクォートをダブルクォートに
                .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3'); // プロパティ名にクォート追加

            // 修復したJSONを検証
            JSON.parse(fixedJson);
            console.log('JSON修復成功!');
            return fixedJson;
        } catch (repairError) {
            console.error('JSON修復に失敗:', repairError);
            return null;
        }
    }
}

// APIレスポンスからスケジュールを処理
function processScheduleResponse(response) {
    console.log('スケジュールレスポンスを処理中...', response.substring(0, 50) + '...');

    // テキスト部分をそのまま表示
    document.getElementById('apiResponse').innerHTML = formatMessageWithLinks(response);

    try {
        // JSON抽出を試みる
        let jsonStr = extractJsonFromText(response);

        if (jsonStr) {
            try {
                // JSONとしてパース
                const data = JSON.parse(jsonStr);
                console.log('JSONパース成功。データタイプ:', Array.isArray(data) ? '配列' : typeof data);

                if (Array.isArray(data)) {
                    console.log(`配列データ: ${data.length}件`);
                    processScheduleItems(data);
                    return;
                } else if (typeof data === 'object' && data !== null) {
                    console.log('オブジェクトデータ。キー:', Object.keys(data));
                    // オブジェクト内に配列があるか探す
                    for (const key in data) {
                        if (Array.isArray(data[key]) && data[key].length > 0) {
                            console.log(`${key}プロパティに配列を発見:`, data[key].length, '件');
                            processScheduleItems(data[key]);
                            return;
                        }
                    }
                    // 単一アイテムとして処理
                    processScheduleItems([data]);
                    return;
                }
            } catch (parseError) {
                console.error('最終的なJSONパースに失敗:', parseError);
            }
        }

        // JSON抽出に失敗した場合、テキストからスケジュールを検出
        console.log('JSONからのスケジュール抽出に失敗。テキスト解析を試みます...');
        const scheduleItems = extractScheduleItemsFromText(response);

        if (scheduleItems && scheduleItems.length > 0) {
            console.log(`テキストから${scheduleItems.length}件のスケジュールアイテム抽出に成功`);
            processScheduleItems(scheduleItems);
        } else {
            // 全ての抽出方法が失敗
            console.log('全ての抽出方法が失敗しました。テキストのみを表示します。');
            showJSONlessResult(response);
        }

        // チャットを有効化
        enableChat();
    } catch (error) {
        console.error('スケジュール処理中のエラー:', error);
        showJSONlessResult(response);
    }
}

// スケジュールアイテムの配列を処理する関数
function processScheduleItems(items) {
    console.log('スケジュールアイテム処理:', items.length, '件');

    // 各アイテムが最低限必要なプロパティを持っているか確認
    const validItems = items.filter(item =>
        item && typeof item === 'object' && (
            // アクティビティ名があるか
            item.activity || item.name || item.title || item.event ||
            // 時間情報があるか
            item.duration || item.length || item.time ||
            (item.start && item.end) || item.startTime || item.endTime
        )
    );

    if (validItems.length === 0) {
        console.log('有効なスケジュールアイテムが見つかりません');
        showJSONlessResult();
        return;
    }

    console.log('有効なスケジュールアイテム:', validItems.length, '件');

    // 標準形式に変換
    const standardizedItems = validItems.map(item => ({
        activity: item.activity || item.name || item.title || item.event || '予定',
        duration: item.duration || item.length || item.time ||
            (item.start && item.end ? calculateDuration(item.start, item.end) : 1),
        start: item.start || item.startTime || null,
        end: item.end || item.endTime || null
    }));

    console.log('標準化されたデータ:', standardizedItems.length, '件');

    // チャートとテーブルで表示
    renderChartJsTimeline(standardizedItems);
}

// テキストからスケジュール情報を抽出する関数
function extractScheduleItemsFromText(text) {
    console.log('テキストからスケジュール情報を抽出...');

    const scheduleItems = [];
    const lines = text.split('\n');

    // 時間パターン（例: 8:00-9:00, 08:00～09:00）
    const timePattern = /(\d{1,2}):(\d{2})(?:\s*[-~〜]\s*(\d{1,2}):(\d{2}))?/g;

    // 行ごとに処理
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // 時間表記を探す
        const timeMatches = Array.from(line.matchAll(timePattern));
        if (timeMatches.length > 0) {
            for (const match of timeMatches) {
                // 活動内容を抽出（時間表記の後ろ部分）
                let activity = line.substring(match.index + match[0].length).trim();

                // 活動が空で次の行があれば、次の行から取得
                if (!activity && i + 1 < lines.length) {
                    activity = lines[i + 1].trim();
                }

                if (!activity) activity = '予定';

                // 時間情報を解析
                const startHour = parseInt(match[1]);
                const startMinute = parseInt(match[2]);

                let endHour, endMinute;
                if (match[3] && match[4]) {
                    endHour = parseInt(match[3]);
                    endMinute = parseInt(match[4]);
                } else {
                    // 終了時間がない場合は開始時間+1時間と仮定
                    endHour = startHour + 1;
                    endMinute = startMinute;
                }

                // 日付部分を作成（今日の日付を使用）
                const today = new Date();
                const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

                // ISO形式の日時文字列
                const startStr = `${dateStr}T${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
                const endStr = `${dateStr}T${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;

                // 所要時間を計算
                const durationHours = endHour - startHour + (endMinute - startMinute) / 60;

                scheduleItems.push({
                    activity: activity,
                    start: startStr,
                    end: endStr,
                    duration: parseFloat(durationHours.toFixed(1))
                });
            }
        }
        // 時間表記がなくても「～時間」などの記述から所要時間を抽出
        else if (line.includes('時間') || line.includes('分')) {
            const durationMatch = line.match(/(\d+)\s*(時間|分)/);
            if (durationMatch) {
                // 活動内容を抽出（時間の後ろの部分）
                let activity = line.replace(/\d+\s*(時間|分)/, '').trim();

                // 所要時間を時間単位で計算
                let durationHours = 0;
                if (durationMatch[1]) {
                    durationHours = parseInt(durationMatch[1]);
                } else if (durationMatch[2]) {
                    durationHours = parseInt(durationMatch[2]) / 60;
                }

                scheduleItems.push({
                    activity: activity,
                    duration: durationHours
                });
            }
        }
    }

    return scheduleItems;
}
