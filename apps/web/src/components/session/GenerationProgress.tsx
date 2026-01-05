/**
 * 生成進捗コンポーネント
 *
 * SSEで生成進捗をリアルタイム表示
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "../../lib/supabase";

// ========================================
// Types
// ========================================

type GenerationStatus =
  | "connecting"
  | "started"
  | "resonance_complete"
  | "plot_complete"
  | "scene_generating"
  | "scene_complete"
  | "completed"
  | "failed";

interface GenerationState {
  status: GenerationStatus;
  message: string;
  progress: number;
  sceneInfo?: {
    current: number;
    total: number;
  };
  triggeredCount?: number;
  replayId?: string;
  error?: string;
}

interface GenerationProgressProps {
  sessionId: string;
  onComplete?: (replayId: string) => void;
  onError?: (error: string) => void;
}

// ========================================
// Component
// ========================================

export function GenerationProgress({
  sessionId,
  onComplete,
  onError,
}: GenerationProgressProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<GenerationState>({
    status: "connecting",
    message: "接続中...",
    progress: 0,
  });

  // コールバックをrefで保持して無限ループを防止
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  const startSSE = useCallback(async () => {
    const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8787";

    // 認証トークンを取得
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      setState({
        status: "failed",
        message: "認証エラー",
        progress: 0,
        error: "ログインが必要です",
      });
      return;
    }

    // EventSource doesn't support custom headers, so we use fetch with streaming
    const response = await fetch(`${apiUrl}/api/session/${sessionId}/stream`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
    });

    if (!response.ok) {
      setState({
        status: "failed",
        message: "接続エラー",
        progress: 0,
        error: `HTTP ${response.status}`,
      });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = "";

    const processEvent = (line: string) => {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        try {
          const event = JSON.parse(data);
          handleEvent(event);
        } catch {
          // ignore parse errors
        }
      }
    };

    const handleEvent = (event: {
      type: string;
      triggeredCount?: number;
      sceneNumber?: number;
      total?: number;
      replayId?: string;
      error?: string;
    }) => {
      switch (event.type) {
        case "started":
          setState({
            status: "started",
            message: "生成を開始しました",
            progress: 5,
          });
          break;

        case "resonance_complete":
          setState({
            status: "resonance_complete",
            message: `共鳴スキャン完了（${event.triggeredCount ?? 0}件のトリガー検出）`,
            progress: 15,
            triggeredCount: event.triggeredCount,
          });
          break;

        case "plot_complete":
          setState({
            status: "plot_complete",
            message: "プロット骨子を生成しました",
            progress: 30,
          });
          break;

        case "scene_generating":
          setState({
            status: "scene_generating",
            message: `シーン生成中... (${event.sceneNumber}/${event.total})`,
            progress: 30 + ((event.sceneNumber ?? 0) / (event.total ?? 1)) * 60,
            sceneInfo: {
              current: event.sceneNumber ?? 0,
              total: event.total ?? 0,
            },
          });
          break;

        case "scene_complete":
          setState((prev) => ({
            ...prev,
            status: "scene_complete",
            message: `シーン ${event.sceneNumber} 完了`,
            progress:
              30 +
              ((event.sceneNumber ?? 0) / (prev.sceneInfo?.total ?? 1)) * 60,
          }));
          break;

        case "completed":
          setState({
            status: "completed",
            message: "生成完了！",
            progress: 100,
            replayId: event.replayId,
          });
          if (event.replayId && onCompleteRef.current) {
            onCompleteRef.current(event.replayId);
          }
          break;

        case "failed":
          setState({
            status: "failed",
            message: "生成に失敗しました",
            progress: 0,
            error: event.error,
          });
          if (event.error && onErrorRef.current) {
            onErrorRef.current(event.error);
          }
          break;
      }
    };

    // Read stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        processEvent(line);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    startSSE();
  }, [startSSE]);

  const goToReplay = () => {
    if (state.replayId) {
      navigate({ to: "/sessions/$id", params: { id: sessionId } });
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="bg-zinc-800/50 rounded-lg border border-zinc-700 p-6">
        {/* ステータスアイコン */}
        <div className="flex items-center justify-center mb-6">
          {state.status === "completed" ? (
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ) : state.status === "failed" ? (
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
              <svg
                className="w-8 h-8 text-amber-500 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* ステータスメッセージ */}
        <div className="text-center mb-6">
          <div className="text-lg font-medium text-zinc-200">
            {state.message}
          </div>
          {state.error && (
            <div className="text-sm text-red-400 mt-2">{state.error}</div>
          )}
        </div>

        {/* プログレスバー */}
        <div className="mb-6">
          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                state.status === "failed"
                  ? "bg-red-500"
                  : state.status === "completed"
                    ? "bg-green-500"
                    : "bg-amber-500"
              }`}
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <div className="text-center text-sm text-zinc-500 mt-2">
            {Math.round(state.progress)}%
          </div>
        </div>

        {/* シーン進捗詳細 */}
        {state.sceneInfo && (
          <div className="text-center text-sm text-zinc-400 mb-4">
            シーン {state.sceneInfo.current} / {state.sceneInfo.total}
          </div>
        )}

        {/* アクションボタン */}
        {state.status === "completed" && state.replayId && (
          <button
            onClick={goToReplay}
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
          >
            リプレイを見る
          </button>
        )}

        {state.status === "failed" && (
          <button
            onClick={() => {
              setState({
                status: "connecting",
                message: "接続中...",
                progress: 0,
              });
              startSSE();
            }}
            className="w-full py-3 px-4 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-medium rounded-lg transition-colors"
          >
            再試行
          </button>
        )}
      </div>
    </div>
  );
}
