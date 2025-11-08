module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/contexts/LiffContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LiffProvider",
    ()=>LiffProvider,
    "useLiff",
    ()=>useLiff
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@line/liff/index.mjs [app-ssr] (ecmascript)");
'use client';
;
;
;
const LiffContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function LiffProvider({ children }) {
    const [isLoggedIn, setIsLoggedIn] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLiffReady, setIsLiffReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let timeoutId = null;
        const initLiff = async ()=>{
            try {
                console.log('🚀 LIFF initialization started');
                const liffId = ("TURBOPACK compile-time value", "2007783683-AzDxzByy");
                console.log('📝 LIFF ID:', ("TURBOPACK compile-time truthy", 1) ? 'Found' : "TURBOPACK unreachable");
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
                // すでに初期化済みかチェック
                console.log('🔍 Checking if LIFF is already initialized...');
                try {
                    const isLoggedInStatus = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].isLoggedIn();
                    console.log('✅ LIFF already initialized, logged in:', isLoggedInStatus);
                    if (isLoggedInStatus) {
                        setIsLiffReady(true);
                        setIsLoggedIn(true);
                        if (timeoutId) clearTimeout(timeoutId);
                        try {
                            console.log('👤 Fetching user profile...');
                            const userProfile = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getProfile();
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
                await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].init({
                    liffId
                });
                console.log('✅ LIFF init completed');
                setIsLiffReady(true);
                if (timeoutId) clearTimeout(timeoutId);
                const isLoggedInStatus = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].isLoggedIn();
                console.log('🔐 Login status after init:', isLoggedInStatus);
                if (isLoggedInStatus) {
                    setIsLoggedIn(true);
                    console.log('👤 Fetching user profile...');
                    const userProfile = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getProfile();
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
        };
        // タイムアウト処理: 30秒経っても初期化が完了しない場合はエラー
        timeoutId = setTimeout(()=>{
            console.error('⏰ LIFF initialization timeout (30 seconds)');
            setError('LIFF initialization timeout. Please reload the page.');
            setIsLiffReady(true);
        }, 30000);
        initLiff();
        return ()=>{
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []);
    const login = ()=>{
        if (!isLiffReady) {
            console.warn('LIFF is not ready yet');
            return;
        }
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].login();
    };
    const logout = ()=>{
        if (!isLiffReady) {
            console.warn('LIFF is not ready yet');
            return;
        }
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].logout();
        setIsLoggedIn(false);
        setProfile(null);
    };
    const sendMessage = async (message)=>{
        if (!isLiffReady) {
            throw new Error('LIFF is not ready');
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].isInClient()) {
            throw new Error('This feature is only available in LINE app');
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].sendMessages([
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
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].closeWindow();
    };
    const shareTargetPicker = async (messages)=>{
        if (!isLiffReady) {
            throw new Error('LIFF is not ready');
        }
        // デバッグ情報を出力
        console.log('LIFF Debug Info:', {
            isInClient: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].isInClient(),
            isLoggedIn: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].isLoggedIn(),
            os: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getOS(),
            language: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getLanguage(),
            version: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getVersion(),
            lineVersion: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getLineVersion(),
            isApiAvailable: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].isApiAvailable('shareTargetPicker')
        });
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].isInClient()) {
            throw new Error('ShareTargetPicker is only available in LINE app. Please open this page in LINE app.');
        }
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].isApiAvailable('shareTargetPicker')) {
            throw new Error('ShareTargetPicker is not available. Please check LIFF app settings (Scope: chat_message.write required).');
        }
        try {
            const result = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].shareTargetPicker(messages);
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
        isInClient: isLiffReady ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$line$2f$liff$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].isInClient() : false
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LiffContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/LiffContext.tsx",
        lineNumber: 224,
        columnNumber: 10
    }, this);
}
function useLiff() {
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(LiffContext);
    if (context === undefined) {
        throw new Error('useLiff must be used within a LiffProvider');
    }
    return context;
}
}),
"[project]/components/ErrorBoundary.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ErrorBoundary
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
;
;
class ErrorBoundary extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Component"] {
    constructor(props){
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }
    static getDerivedStateFromError(error) {
        return {
            hasError: true,
            error
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "min-h-screen flex items-center justify-center bg-gray-900 p-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8 text-center",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-6xl mb-4",
                            children: "⚠️"
                        }, void 0, false, {
                            fileName: "[project]/components/ErrorBoundary.tsx",
                            lineNumber: 43,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-2xl font-bold text-white mb-4",
                            children: "エラーが発生しました"
                        }, void 0, false, {
                            fileName: "[project]/components/ErrorBoundary.tsx",
                            lineNumber: 44,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-gray-300 mb-6",
                            children: "申し訳ございません。予期しないエラーが発生しました。"
                        }, void 0, false, {
                            fileName: "[project]/components/ErrorBoundary.tsx",
                            lineNumber: 47,
                            columnNumber: 13
                        }, this),
                        this.state.error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("details", {
                            className: "text-left mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("summary", {
                                    className: "text-sm text-gray-400 cursor-pointer hover:text-gray-300 mb-2",
                                    children: "エラー詳細"
                                }, void 0, false, {
                                    fileName: "[project]/components/ErrorBoundary.tsx",
                                    lineNumber: 52,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                    className: "text-xs text-red-400 bg-gray-900 p-4 rounded overflow-auto max-h-40",
                                    children: this.state.error.message
                                }, void 0, false, {
                                    fileName: "[project]/components/ErrorBoundary.tsx",
                                    lineNumber: 55,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ErrorBoundary.tsx",
                            lineNumber: 51,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>window.location.href = '/',
                            className: "bg-[#06C755] hover:bg-[#05b34c] text-white px-6 py-3 rounded-lg transition w-full",
                            children: "ホームに戻る"
                        }, void 0, false, {
                            fileName: "[project]/components/ErrorBoundary.tsx",
                            lineNumber: 60,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ErrorBoundary.tsx",
                    lineNumber: 42,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/ErrorBoundary.tsx",
                lineNumber: 41,
                columnNumber: 9
            }, this);
        }
        return this.props.children;
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__3290f705._.js.map