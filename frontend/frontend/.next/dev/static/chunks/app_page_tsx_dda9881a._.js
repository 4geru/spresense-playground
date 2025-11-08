(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SlideshowPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function SlideshowPage() {
    _s();
    const [images, setImages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [currentIndex, setCurrentIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [notification, setNotification] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [lastImageCount, setLastImageCount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [currentTime, setCurrentTime] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const supabaseUrl = ("TURBOPACK compile-time value", "https://fyxftmwypdfuierggfqw.supabase.co");
    const supabaseKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eGZ0bXd5cGRmdWllcmdnZnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDg3MDksImV4cCI6MjA3NTc4NDcwOX0.qS6jgQKMkw7jhic0SR9n1_KspGAe5Acc-RE0yh56euo");
    // 画像を読み込む
    const loadImages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SlideshowPage.useCallback[loadImages]": async ()=>{
            try {
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
                const response = await fetch(`${supabaseUrl}/functions/v1/get-original-images`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
                }
                const result = await response.json();
                if (result.success && result.images) {
                    const imageList = result.images.map({
                        "SlideshowPage.useCallback[loadImages].imageList": (image)=>({
                                name: image.name,
                                url: image.url,
                                created_at: image.created_at,
                                size: image.size
                            })
                    }["SlideshowPage.useCallback[loadImages].imageList"]);
                    setImages(imageList);
                    setLastImageCount(imageList.length);
                    if (imageList.length > 0) {
                        setCurrentIndex(Math.floor(Math.random() * imageList.length));
                        setLoading(false);
                    } else {
                        throw new Error('No images found with "original_capture" in filename');
                    }
                } else {
                    throw new Error(result.error || 'No images returned from Edge Function');
                }
            } catch (err) {
                console.error('Error loading images:', err);
                setError(err instanceof Error ? err.message : 'Failed to load images');
                setLoading(false);
            }
        }
    }["SlideshowPage.useCallback[loadImages]"], [
        supabaseUrl,
        supabaseKey
    ]);
    // 新しい画像をチェック
    const checkForNewImages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SlideshowPage.useCallback[checkForNewImages]": async ()=>{
            try {
                if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
                ;
                const response = await fetch(`${supabaseUrl}/functions/v1/get-original-images`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${supabaseKey}`,
                        'apikey': supabaseKey,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) return;
                const result = await response.json();
                if (result.success && result.images) {
                    const newImageCount = result.images.length;
                    if (newImageCount > lastImageCount) {
                        console.log(`🆕 New images detected! ${lastImageCount} → ${newImageCount}`);
                        const imageList = result.images.map({
                            "SlideshowPage.useCallback[checkForNewImages].imageList": (image)=>({
                                    name: image.name,
                                    url: image.url,
                                    created_at: image.created_at,
                                    size: image.size
                                })
                        }["SlideshowPage.useCallback[checkForNewImages].imageList"]);
                        setImages(imageList);
                        setLastImageCount(newImageCount);
                        setCurrentIndex(Math.floor(Math.random() * imageList.length));
                        setNotification(`🆕 ${newImageCount - lastImageCount} new image${newImageCount - lastImageCount > 1 ? 's' : ''} detected!`);
                        setTimeout({
                            "SlideshowPage.useCallback[checkForNewImages]": ()=>setNotification(null)
                        }["SlideshowPage.useCallback[checkForNewImages]"], 3000);
                    }
                }
            } catch (err) {
                console.error('Error checking for new images:', err);
            }
        }
    }["SlideshowPage.useCallback[checkForNewImages]"], [
        supabaseUrl,
        supabaseKey,
        lastImageCount
    ]);
    // 次の画像に移動
    const nextImage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SlideshowPage.useCallback[nextImage]": ()=>{
            if (images.length === 0) return;
            let nextIndex;
            if (images.length > 1) {
                do {
                    nextIndex = Math.floor(Math.random() * images.length);
                }while (nextIndex === currentIndex)
            } else {
                nextIndex = 0;
            }
            setCurrentIndex(nextIndex);
        }
    }["SlideshowPage.useCallback[nextImage]"], [
        images.length,
        currentIndex
    ]);
    // 初期読み込み
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SlideshowPage.useEffect": ()=>{
            loadImages();
        }
    }["SlideshowPage.useEffect"], [
        loadImages
    ]);
    // スライドショー
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SlideshowPage.useEffect": ()=>{
            if (images.length <= 1) return;
            const getRandomInterval = {
                "SlideshowPage.useEffect.getRandomInterval": ()=>Math.floor(Math.random() * 1000) + 2000
            }["SlideshowPage.useEffect.getRandomInterval"]; // 2-3秒
            const scheduleNext = {
                "SlideshowPage.useEffect.scheduleNext": ()=>{
                    const interval = getRandomInterval();
                    const timer = setTimeout({
                        "SlideshowPage.useEffect.scheduleNext.timer": ()=>{
                            nextImage();
                        }
                    }["SlideshowPage.useEffect.scheduleNext.timer"], interval);
                    return timer;
                }
            }["SlideshowPage.useEffect.scheduleNext"];
            const timer = scheduleNext();
            return ({
                "SlideshowPage.useEffect": ()=>clearTimeout(timer)
            })["SlideshowPage.useEffect"];
        }
    }["SlideshowPage.useEffect"], [
        images.length,
        nextImage,
        currentIndex
    ]);
    // 自動リフレッシュ（30秒ごと）
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SlideshowPage.useEffect": ()=>{
            const interval = setInterval({
                "SlideshowPage.useEffect.interval": ()=>{
                    checkForNewImages();
                }
            }["SlideshowPage.useEffect.interval"], 30000);
            return ({
                "SlideshowPage.useEffect": ()=>clearInterval(interval)
            })["SlideshowPage.useEffect"];
        }
    }["SlideshowPage.useEffect"], [
        checkForNewImages
    ]);
    // 時刻更新
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SlideshowPage.useEffect": ()=>{
            const updateTime = {
                "SlideshowPage.useEffect.updateTime": ()=>{
                    setCurrentTime(new Date().toLocaleTimeString());
                }
            }["SlideshowPage.useEffect.updateTime"];
            updateTime();
            const interval = setInterval(updateTime, 1000);
            return ({
                "SlideshowPage.useEffect": ()=>clearInterval(interval)
            })["SlideshowPage.useEffect"];
        }
    }["SlideshowPage.useEffect"], []);
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex min-h-screen items-center justify-center bg-black",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-white text-2xl",
                children: "Loading images..."
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 183,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 182,
            columnNumber: 7
        }, this);
    }
    if (error) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex min-h-screen items-center justify-center bg-black",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-red-400 text-xl text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        children: "Failed to load images from Supabase"
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 192,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-2",
                        children: "Please check your connection and configuration"
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 193,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "mt-4 text-sm",
                        children: error
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 194,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 191,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/app/page.tsx",
            lineNumber: 190,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "relative w-screen h-screen bg-black overflow-hidden",
        children: [
            notification && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed top-5 right-5 bg-green-500 bg-opacity-90 text-white px-5 py-4 rounded-lg text-base z-[2000] shadow-lg animate-slide-in",
                children: notification
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 204,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed top-5 left-5 bg-black bg-opacity-70 text-white px-4 py-2 rounded-md text-sm z-[2000]",
                children: [
                    "📸 Images: ",
                    images.length,
                    " | 🕒 ",
                    currentTime
                ]
            }, void 0, true, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 210,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                href: "/slides",
                className: "fixed top-5 left-1/2 -translate-x-1/2 bg-purple-600 bg-opacity-90 hover:bg-opacity-100 text-white px-6 py-2 rounded-lg text-sm z-[2000] transition shadow-lg",
                children: "📷 View Gallery"
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 215,
                columnNumber: 7
            }, this),
            images.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full h-full flex items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative w-full h-full",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        src: images[currentIndex].url,
                        alt: images[currentIndex].name,
                        fill: true,
                        className: "object-contain",
                        priority: true,
                        unoptimized: true
                    }, void 0, false, {
                        fileName: "[project]/app/page.tsx",
                        lineNumber: 226,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/app/page.tsx",
                    lineNumber: 225,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/page.tsx",
                lineNumber: 224,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/page.tsx",
        lineNumber: 201,
        columnNumber: 5
    }, this);
}
_s(SlideshowPage, "574aajuU88dr200lO8PQtEewsbw=");
_c = SlideshowPage;
var _c;
__turbopack_context__.k.register(_c, "SlideshowPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=app_page_tsx_dda9881a._.js.map