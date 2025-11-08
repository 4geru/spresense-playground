(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/contexts/LiffContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LiffProvider",
    ()=>LiffProvider,
    "useLiff",
    ()=>useLiff
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@line/liff/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const LiffContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function LiffProvider({ children }) {
    _s();
    const [isLoggedIn, setIsLoggedIn] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLiffReady, setIsLiffReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LiffProvider.useEffect": ()=>{
            let timeoutId = null;
            const initLiff = {
                "LiffProvider.useEffect.initLiff": async ()=>{
                    try {
                        console.log('🚀 LIFF initialization started');
                        const liffId = ("TURBOPACK compile-time value", "2007783683-AzDxzByy");
                        console.log('📝 LIFF ID:', ("TURBOPACK compile-time truthy", 1) ? 'Found' : "TURBOPACK unreachable");
                        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                        ;
                        // すでに初期化済みかチェック
                        console.log('🔍 Checking if LIFF is already initialized...');
                        try {
                            const isLoggedInStatus = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].isLoggedIn();
                            console.log('✅ LIFF already initialized, logged in:', isLoggedInStatus);
                            if (isLoggedInStatus) {
                                setIsLiffReady(true);
                                setIsLoggedIn(true);
                                if (timeoutId) clearTimeout(timeoutId);
                                try {
                                    console.log('👤 Fetching user profile...');
                                    const userProfile = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].getProfile();
                                    console.log('✅ Profile fetched:', userProfile.displayName);
                                    setProfile({
                                        userId: userProfile.userId,
                                        displayName: userProfile.displayName,
                                        pictureUrl: userProfile.pictureUrl,
                                        statusMessage: userProfile.statusMessage
                                    });
                                } catch (profileErr) {
                                    console.error('❌ Profile fetch failed:', profileErr);
                                }
                                return;
                            } else {
                                console.log('ℹ️ LIFF initialized but not logged in');
                                setIsLiffReady(true);
                                if (timeoutId) clearTimeout(timeoutId);
                                return;
                            }
                        } catch (checkErr) {
                            console.log('ℹ️ LIFF not yet initialized, proceeding with init...');
                        }
                        // 初回初期化
                        console.log('🔧 Starting LIFF init...');
                        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].init({
                            liffId
                        });
                        console.log('✅ LIFF init completed');
                        setIsLiffReady(true);
                        if (timeoutId) clearTimeout(timeoutId);
                        const isLoggedInStatus = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].isLoggedIn();
                        console.log('🔐 Login status after init:', isLoggedInStatus);
                        if (isLoggedInStatus) {
                            setIsLoggedIn(true);
                            console.log('👤 Fetching user profile...');
                            const userProfile = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].getProfile();
                            console.log('✅ Profile fetched:', userProfile.displayName);
                            setProfile({
                                userId: userProfile.userId,
                                displayName: userProfile.displayName,
                                pictureUrl: userProfile.pictureUrl,
                                statusMessage: userProfile.statusMessage
                            });
                        }
                    } catch (err) {
                        console.error('❌ LIFF initialization failed:', err);
                        const errorMessage = err instanceof Error ? err.message : 'LIFF initialization failed';
                        console.error('Error details:', errorMessage);
                        setError(errorMessage);
                        setIsLiffReady(true);
                        if (timeoutId) clearTimeout(timeoutId);
                    }
                }
            }["LiffProvider.useEffect.initLiff"];
            // タイムアウト処理: 30秒経っても初期化が完了しない場合はエラー
            timeoutId = setTimeout({
                "LiffProvider.useEffect": ()=>{
                    console.error('⏰ LIFF initialization timeout (30 seconds)');
                    setError('LIFF initialization timeout. Please reload the page.');
                    setIsLiffReady(true);
                }
            }["LiffProvider.useEffect"], 30000);
            initLiff();
            return ({
                "LiffProvider.useEffect": ()=>{
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                }
            })["LiffProvider.useEffect"];
        }
    }["LiffProvider.useEffect"], []);
    const login = ()=>{
        if (!isLiffReady) {
            console.warn('LIFF is not ready yet');
            return;
        }
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].login();
    };
    const logout = ()=>{
        if (!isLiffReady) {
            console.warn('LIFF is not ready yet');
            return;
        }
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].logout();
        setIsLoggedIn(false);
        setProfile(null);
    };
    const sendMessage = async (message)=>{
        if (!isLiffReady) {
            throw new Error('LIFF is not ready');
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].isInClient()) {
            throw new Error('This feature is only available in LINE app');
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].sendMessages([
            {
                type: 'text',
                text: message
            }
        ]);
    };
    const closeWindow = ()=>{
        if (!isLiffReady) {
            console.warn('LIFF is not ready yet');
            return;
        }
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].closeWindow();
    };
    const shareTargetPicker = async (messages)=>{
        if (!isLiffReady) {
            throw new Error('LIFF is not ready');
        }
        // デバッグ情報を出力
        console.log('LIFF Debug Info:', {
            isInClient: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].isInClient(),
            isLoggedIn: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].isLoggedIn(),
            os: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].getOS(),
            language: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].getLanguage(),
            version: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].getVersion(),
            lineVersion: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].getLineVersion(),
            isApiAvailable: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].isApiAvailable('shareTargetPicker')
        });
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].isInClient()) {
            throw new Error('ShareTargetPicker is only available in LINE app. Please open this page in LINE app.');
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].isApiAvailable('shareTargetPicker')) {
            throw new Error('ShareTargetPicker is not available. Please check LIFF app settings (Scope: chat_message.write required).');
        }
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].shareTargetPicker(messages);
            return result;
        } catch (err) {
            console.error('ShareTargetPicker error:', err);
            throw err;
        }
    };
    const value = {
        isLoggedIn,
        profile,
        isLiffReady,
        error,
        login,
        logout,
        sendMessage,
        closeWindow,
        shareTargetPicker,
        isInClient: isLiffReady ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].isInClient() : false
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LiffContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/LiffContext.tsx",
        lineNumber: 224,
        columnNumber: 10
    }, this);
}
_s(LiffProvider, "B+dq3TI4aaWUnaf5xrLk7nTHL+s=");
_c = LiffProvider;
function useLiff() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(LiffContext);
    if (context === undefined) {
        throw new Error('useLiff must be used within a LiffProvider');
    }
    return context;
}
_s1(useLiff, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "LiffProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=contexts_LiffContext_tsx_2dece9ef._.js.map