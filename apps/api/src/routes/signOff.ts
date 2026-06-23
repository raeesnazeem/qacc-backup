import { Router, Request, Response } from "express"
import { supabase } from "../lib/supabase"
import { clerkAuth } from "../middleware/clerkAuth"
import { requireRole } from "../middleware/requireRole"
import { getProjectSettings } from "../lib/getDecryptedSettings"
import {
  createBasecampCampfireLine,
  deleteBasecampCampfireLine,
  formatBasecampMention,
  formatBasecampCampfireMention,
  getBasecampPeople,
  getBasecampPerson,
} from "../lib/basecampClient"

const router: Router = Router()

/**
 * Helper to get Supabase user UUID from Clerk ID
 */
async function getSupabaseUserId(clerkIdOrUuid: string): Promise<string> {
  if (clerkIdOrUuid.length === 36 && clerkIdOrUuid.includes("-")) {
    return clerkIdOrUuid
  }

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkIdOrUuid)
    .single()

  if (error || !data) {
    throw new Error(`User not synced: ${clerkIdOrUuid}`)
  }
  return data.id
}

/**
 * POST /api/runs/:id/sign-off
 * Sign off on a completed QA run. Restricted to project_manager and above.
 */
router.post(
  "/:id/sign-off",
  clerkAuth,
  requireRole("project_manager"),
  async (req: Request, res: Response) => {
    const { id } = req.params
    const { notes, notifyUserIds } = req.body
    const { userId: clerkUserId } = req.auth!

    try {
      const supabaseUserId = await getSupabaseUserId(clerkUserId)

      // 1. Verify run exists and is completed
      const { data: run, error: runError } = await supabase
        .from("qa_runs")
        .select("status, project_id")
        .eq("id", id)
        .single()

      if (runError || !run) {
        return res.status(404).json({ error: "Run not found" })
      }

      if (run.status !== "completed") {
        return res
          .status(400)
          .json({ error: "Only completed runs can be signed off" })
      }

      // 2. Check if already signed off
      const { data: existingSignOff } = await supabase
        .from("sign_offs")
        .select("id")
        .eq("run_id", id)
        .single()

      if (existingSignOff) {
        return res.status(400).json({ error: "Run is already signed off" })
      }

      // 3. Create sign-off record
      const { data: signOff, error: signOffError } = await supabase
        .from("sign_offs")
        .insert({
          run_id: id,
          signed_by: supabaseUserId,
          notes: notes || null,
        })
        .select()
        .single()

      if (signOffError) throw signOffError

      // 4. Send Campfire Notification
      try {
        const settings = await getProjectSettings(run.project_id)

        console.log(
          `Basecamp Project ID configured for this run: ${settings?.basecamp_project_id}`,
        )
        // Inject it into the signOff object so it's returned to the frontend
        ;(signOff as any).target_basecamp_project_id =
          settings?.basecamp_project_id

        if (
          settings &&
          settings.basecamp_token &&
          settings.basecamp_account_id &&
          settings.basecamp_project_id
        ) {
          let mentionsStr = ""
          if (
            notifyUserIds &&
            Array.isArray(notifyUserIds) &&
            notifyUserIds.length > 0
          ) {
            // Get users from our DB to get their basecamp_person_id
            const { data: usersToNotify } = await supabase
              .from("users")
              .select("id, full_name, basecamp_person_id")
              .in("id", notifyUserIds)

            if (usersToNotify && usersToNotify.length > 0) {
              const mentions = usersToNotify.map((user) => {
                // The Basecamp Campfire API endpoint strictly parses content as plain text.
                // It does not parse HTML tags (<bc-attachment> or <a>) into mentions.
                // Therefore, true @mentions via the Campfire API are impossible.
                return `@${user.full_name}`
              })

              mentionsStr = mentions.join(" ")
            }
          }

          const messageHeader = `QA Run Signed Off`
          const messageNotes = notes ? `\n${notes}` : ``
          const messageBody = mentionsStr ? `\n\n${mentionsStr}` : ``

          const content = messageHeader + messageNotes + messageBody

          const campfireResponse = await createBasecampCampfireLine({
            token: settings.basecamp_token,
            accountId: settings.basecamp_account_id,
            projectId: settings.basecamp_project_id,
            content,
          })

          const { error: updateError } = await supabase
            .from("sign_offs")
            .update({
              basecamp_message_id: String(campfireResponse.id),
              basecamp_url: campfireResponse.app_url,
            })
            .eq("id", signOff.id)

          if (updateError) {
            console.error("[SignOff POST] Failed to update sign_offs with basecamp ID:", updateError)
          } else {
            console.log(`[SignOff POST] Successfully saved basecamp_message_id: ${campfireResponse.id}`)
          }
        }
      } catch (bcError: any) {
        console.error("[Basecamp Campfire Error]:", bcError)
        // Return the error in the response so we can see why it failed silently!
        return res.status(201).json({
          ...signOff,
          basecamp_error: bcError.response
            ? bcError.response.data
            : bcError.message,
        })
      }

      return res.status(201).json(signOff)
    } catch (error: any) {
      console.error("[Sign-off Error]:", error)
      return res.status(500).json({ error: error.message })
    }
  },
)

/**
 * DELETE /api/runs/:id/sign-off
 * Revoke sign-off and delete the Basecamp notification if it exists.
 */
router.delete(
  "/:id/sign-off",
  clerkAuth,
  requireRole("project_manager"),
  async (req: Request, res: Response) => {
    const { id } = req.params

    try {
      const { data: signOff, error: fetchError } = await supabase
        .from("sign_offs")
        .select(
          `
          id, 
          basecamp_message_id, 
          qa_runs ( project_id )
        `,
        )
        .eq("run_id", id)
        .single()

      if (fetchError || !signOff) {
        return res.status(404).json({ error: "Sign-off not found" })
      }

      if (signOff.basecamp_message_id) {
        console.log(`[SignOff DELETE] Found basecamp_message_id: ${signOff.basecamp_message_id}`)
        try {
          const projectId = Array.isArray(signOff.qa_runs)
            ? signOff.qa_runs[0]?.project_id
            : (signOff.qa_runs as any)?.project_id

          console.log(`[SignOff DELETE] Resolved projectId: ${projectId}`)

          if (projectId) {
            const settings = await getProjectSettings(projectId)
            console.log(`[SignOff DELETE] Settings valid for deletion: ${!!(settings && settings.basecamp_token && settings.basecamp_account_id && settings.basecamp_project_id)}`)
            
            if (
              settings &&
              settings.basecamp_token &&
              settings.basecamp_account_id &&
              settings.basecamp_project_id
            ) {
              await deleteBasecampCampfireLine({
                token: settings.basecamp_token,
                accountId: settings.basecamp_account_id,
                projectId: settings.basecamp_project_id,
                messageId: signOff.basecamp_message_id,
              })
            }
          }
        } catch (bcError) {
          console.error("[Basecamp Delete Error]:", bcError)
        }
      } else {
        console.log(`[SignOff DELETE] No basecamp_message_id found on signOff record.`)
      }

      const { error: deleteError } = await supabase
        .from("sign_offs")
        .delete()
        .eq("id", signOff.id)

      if (deleteError) throw deleteError

      return res.status(200).json({ message: "Sign-off revoked" })
    } catch (error: any) {
      console.error("[Revoke Sign-off Error]:", error)
      return res.status(500).json({ error: error.message })
    }
  },
)

export { router as signOffRouter }
