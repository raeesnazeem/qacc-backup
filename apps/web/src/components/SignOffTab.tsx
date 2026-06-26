import { Download, Send } from "lucide-react"
import { SignOffButton } from "./SignOffButton"
import toast from "react-hot-toast"

export const SignOffTab = ({
  run,
  runFindings,
  runId,
  runTasks = [],
}: {
  run: any
  runFindings: any[]
  runId: string
  runTasks?: any[]
}) => {
  const tasksTotal = runTasks.length
  const tasksClosed = runTasks.filter((t) => t.status === "closed").length
  const tasksProgress =
    tasksTotal > 0 ? Math.round((tasksClosed / tasksTotal) * 100) : 100

  return (
    <div className="space-y-8 animate-in fade-in duration-200 dark:bg-[#131d22] dark:p-6 dark:rounded-2xl">
      {/* Report Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 Capitalize">
            QA Report
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Summary and official sign-off for Run #{runId?.substring(0, 8)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#1d2a31] text-slate-900 dark:text-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-md hover:bg-slate-200 dark:hover:bg-[#162128] transition-all border border-slate-200 dark:border-slate-700"
            onClick={() => toast.success("PDF Generation started")}
          >
            <Download size={14} />
            Export PDF
          </button>
          {run.status === "completed" && (
            <SignOffButton
              runId={runId!}
              projectId={run.project_id}
              isSignedOff={run.sign_offs && run.sign_offs.length > 0}
              signOffDetails={run.sign_offs?.[0]}
              label={
                run.run_type === "pre_release"
                  ? "Sign off Pre-release"
                  : undefined
              }
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Summary */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-50 dark:bg-[#1D2A31] rounded-md border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-slate-700">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">
                Quality Score
              </h3>
              <div className="flex items-end gap-4">
                <p className="text-6xl font-bold text-slate-900 dark:text-white leading-none">
                  {Math.max(
                    0,
                    100 -
                      (Object.values(run.finding_counts || {}) as any[]).reduce(
                        (a: any, b: any) => a + b,
                        0,
                      ) *
                        2,
                  )}
                  %
                </p>
                <div className="pb-1">
                  <p className="text-xs font-bold text-emerald-600 uppercase">
                    Healthy
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Based on finding density
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-b border-slate-50 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/20">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {tasksTotal === 0
                  ? "No issues were generated during this run. The release is clean."
                  : tasksProgress === 100
                    ? "All issues have been successfully resolved. The release is ready for sign-off."
                    : `${tasksTotal - tasksClosed} issues require attention before this release can be signed off.`}
              </p>
            </div>

            <div className="p-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Critical
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {run.finding_counts?.critical || 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  High
                </p>
                <p className="text-2xl font-bold text-orange-500">
                  {run.finding_counts?.high || 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Medium
                </p>
                <p className="text-2xl font-bold text-amber-500">
                  {run.finding_counts?.medium || 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Low
                </p>
                <p className="text-2xl font-bold text-blue-500">
                  {run.finding_counts?.low || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-[#1D2A31] rounded-md border border-slate-200 dark:border-slate-700 shadow-sm p-8">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">
              Finding Categories
            </h3>
            <div className="space-y-4">
              {[
                {
                  label: "Visual Consistency",
                  count:
                    runFindings?.filter((f) => f.check_factor === "visual_diff")
                      .length || 0,
                  color: "bg-blue-500",
                },
                {
                  label: "Performance",
                  count:
                    runFindings?.filter((f) => f.check_factor === "performance")
                      .length || 0,
                  color: "bg-emerald-500",
                },
                {
                  label: "Accessibility",
                  count:
                    runFindings?.filter(
                      (f) => f.check_factor === "accessibility",
                    ).length || 0,
                  color: "bg-purple-500",
                },
                {
                  label: "Console Errors",
                  count:
                    runFindings?.filter(
                      (f) => f.check_factor === "console_error",
                    ).length || 0,
                  color: "bg-red-500",
                },
                {
                  label: "SEO",
                  count:
                    runFindings?.filter((f) => f.check_factor === "seo")
                      .length || 0,
                  color: "bg-amber-500",
                },
                {
                  label: "Functional / General",
                  count:
                    runFindings?.filter(
                      (f) =>
                        ![
                          "visual_diff",
                          "performance",
                          "accessibility",
                          "console_error",
                          "seo",
                        ].includes(f.check_factor),
                    ).length || 0,
                  color: "bg-indigo-500",
                },
              ].map((cat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                    <span className="text-slate-600 dark:text-slate-400">
                      {cat.label}
                    </span>
                    <span className="text-slate-900 dark:text-white">
                      {cat.count} Findings
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${cat.color} rounded-full`}
                      style={{
                        width: `${Math.min(
                          100,
                          (cat.count / (runFindings?.length || 1)) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Run Info & Actions */}
        <div className="space-y-8">
          <div className="bg-slate-900 dark:bg-[#1d2a31] rounded-md p-8 text-white">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">
              Run Details
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Site URL
                </p>
                <p className="text-sm font-bold mt-1 text-sky-400 break-all">
                  {run.site_url || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Started At
                </p>
                <p className="text-sm font-bold mt-1">
                  {run.started_at
                    ? new Date(run.started_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Completed At
                </p>
                <p className="text-sm font-bold mt-1">
                  {run.completed_at
                    ? new Date(run.completed_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Run Type
                </p>
                <p className="text-sm font-bold mt-1 uppercase">
                  {run.run_type.replace("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  Run By
                </p>
                <p className="text-sm font-bold mt-1">
                  {run.created_by_name || "System"}
                </p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <button
                  className="w-full py-3 bg-slate-50/10 hover:bg-slate-50/20 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all border border-white/5 flex items-center justify-center gap-2"
                  onClick={() => toast.success("Report shared with team")}
                >
                  <Send size={14} />
                  Share Report
                </button>
              </div>
            </div>
          </div>

          {/* Issue Resolution Section */}
          <div className="bg-slate-900 dark:bg-[#1d2a31] rounded-md p-8 text-white mt-8">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-6">
              Issue Resolution
            </h3>
            <div className="space-y-6">
              <div className="flex items-end gap-4">
                <p className="text-5xl font-bold text-white leading-none">
                  {tasksProgress}%
                </p>
                <div className="pb-1">
                  <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                    Resolved
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                  <span className="text-slate-400">Progress</span>
                  <span className="text-white">
                    {tasksClosed} / {tasksTotal}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${tasksProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
