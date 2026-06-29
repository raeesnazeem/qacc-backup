import axios from "axios"

const pkg = require("../../package.json")

interface CreateBasecampTodoParams {
  token: string
  accountId: string
  projectId: string
  todolistId: string
  title: string
  description: string
  assigneeIds?: number[]
}

/**
 * Creates a to-do in Basecamp 3
 */
export async function createBasecampTodo(
  params: CreateBasecampTodoParams,
): Promise<{ id: number; url: string }> {
  const {
    token,
    accountId,
    projectId,
    todolistId,
    title,
    description,
    assigneeIds,
  } = params

  // Basecamp 3 recommends flat routes where possible.
  // We use the todolists endpoint directly to reduce potential 404s from bucket hierarchy mismatches.
  const url = `https://3.basecampapi.com/${accountId}/todolists/${todolistId}/todos.json`

  console.log(`[BasecampClient] Creating todo at URL: ${url}`)

  const requestBody = {
    content: title,
    description: description,
    assignee_ids: assigneeIds || [],
  }

  console.log(
    "[BasecampClient] POST Request Body:",
    JSON.stringify(requestBody, null, 2),
  )

  try {
    const response = await axios.post(url, requestBody, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": `${pkg.name} (${process.env.SUPPORT_EMAIL || "raees.nazeem@growth99.com"}) v${pkg.version}`,
      },
    })

    return {
      id: response.data.id,
      url: response.data.app_url,
    }
  } catch (error: any) {
    if (error.response) {
      const detailedError = new Error(
        `Basecamp API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
      )
      ;(detailedError as any).status = error.response.status
      ;(detailedError as any).data = error.response.data
      throw detailedError
    }
    throw error
  }
}

/**
 * Fetches all people in the Basecamp account to get their SGIDs for mentions.
 */
export async function getBasecampPeople(
  token: string,
  accountId: string,
): Promise<Record<number, any>> {
  const url = `https://3.basecampapi.com/${accountId}/people.json`

  console.log(`[BasecampClient] Fetching people from URL: ${url}`)

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": `${pkg.name} (${process.env.SUPPORT_EMAIL || "raees.nazeem@growth99.com"}) v${pkg.version}`,
      },
    })

    console.log(
      "[BasecampClient] RAW People API Response:",
      JSON.stringify(response.data, null, 2),
    )

    const peopleMap: Record<number, any> = {}

    if (Array.isArray(response.data)) {
      response.data.forEach((person: any) => {
        peopleMap[person.id] = person
      })
    }

    return peopleMap
  } catch (error: any) {
    if (error.response) {
      const detailedError = new Error(
        `Basecamp API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
      )
      ;(detailedError as any).status = error.response.status
      ;(detailedError as any).data = error.response.data
      throw detailedError
    }
    throw error
  }
}

/**
 * Fetches a single person in the Basecamp account.
 */
export async function getBasecampPerson(
  token: string,
  accountId: string,
  personId: number,
): Promise<any> {
  const url = `https://3.basecampapi.com/${accountId}/people/${personId}.json`

  console.log(`[BasecampClient] Fetching person ${personId} from URL: ${url}`)

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": `${pkg.name} (${process.env.SUPPORT_EMAIL || "raees.nazeem@growth99.com"}) v${pkg.version}`,
      },
    })

    console.log(
      `[BasecampClient] Person ${personId} response:`,
      JSON.stringify(response.data, null, 2),
    )
    return response.data
  } catch (error: any) {
    console.error(
      `[BasecampClient] Error fetching person ${personId}:`,
      error.message,
    )
    return null
  }
}

/**
 * Formats a Basecamp mention HTML tag.
 */
export function formatBasecampMention(sgid: string, name: string): string {
  return `<bc-attachment sgid="${sgid}" content-type="application/vnd.basecamp.mention"><figure><figcaption>${name}</figcaption></figure></bc-attachment>`
}

/**
 * Formats a mention specifically for Basecamp Campfire chat lines.
 * Uses bc-attachment + bc-mention format matching Basecamp's own Lexical editor serialization.
 */
export function formatBasecampCampfireMention(
  sgid: string,
  name: string,
): string {
  return `<bc-attachment sgid="${sgid}" content-type="application/vnd.basecamp.mention"><bc-mention>${name}</bc-mention></bc-attachment>`
}

/**
 * Adds a comment to a recording (to-do, etc.) in Basecamp 3
 */
export async function createBasecampComment(params: {
  token: string
  accountId: string
  projectId: string
  recordingId: string
  content: string
}): Promise<{ id: number; url: string }> {
  const { token, accountId, projectId, recordingId, content } = params
  const url = `https://3.basecampapi.com/${accountId}/buckets/${projectId}/recordings/${recordingId}/comments.json`

  console.log(`[BasecampClient] Creating comment at URL: ${url}`)

  try {
    const response = await axios.post(
      url,
      { content },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": `${pkg.name} (${process.env.SUPPORT_EMAIL || "raees.nazeem@growth99.com"}) v${pkg.version}`,
        },
      },
    )

    return {
      id: response.data.id,
      url: response.data.app_url,
    }
  } catch (error: any) {
    if (error.response) {
      const detailedError = new Error(
        `Basecamp API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
      )
      ;(detailedError as any).status = error.response.status
      ;(detailedError as any).data = error.response.data
      throw detailedError
    }
    throw error
  }
}

/**
 * Deletes a comment from a recording in Basecamp 3
 * Used for rollback when notification fails
 */
export async function deleteBasecampComment(params: {
  token: string
  accountId: string
  projectId: string
  recordingId: string
  commentId: number
}): Promise<void> {
  const { token, accountId, projectId, recordingId, commentId } = params
  const url = `https://3.basecampapi.com/${accountId}/buckets/${projectId}/recordings/${commentId}/status/trashed.json`

  try {
    await axios.put(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "User-Agent": `${pkg.name} (${process.env.SUPPORT_EMAIL || "raees.nazeem@growth99.com"}) v${pkg.version}`,
        },
      },
    )
  } catch (error: any) {
    if (error.response) {
      const detailedError = new Error(
        `Basecamp API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
      )
      ;(detailedError as any).status = error.response.status
      ;(detailedError as any).data = error.response.data
      throw detailedError
    }
    throw error
  }
}

/**
 * Posts a message to the project's Basecamp 3 Campfire.
 * Fetches the first campfire in the project and posts a line to it.
 */
export async function createBasecampCampfireLine(params: {
  token: string
  accountId: string
  projectId: string
  content: string
}): Promise<{ id: number; app_url: string }> {
  const { token, accountId, projectId, content } = params

  const chatsUrl = `https://3.basecampapi.com/${accountId}/buckets/${projectId}/chats.json`
  console.log(`[BasecampClient] Fetching Campfires at URL: ${chatsUrl}`)

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": `${pkg.name} (${process.env.SUPPORT_EMAIL || "raees.nazeem@growth99.com"}) v${pkg.version}`,
  }

  try {
    // Fetch the project (bucket) itself to get its exact dock of tools
    const bucketUrl = `https://3.basecampapi.com/${accountId}/projects/${projectId}.json`
    console.log(`[BasecampClient] Fetching Project Bucket: ${bucketUrl}`)
    const bucketResponse = await axios.get(bucketUrl, { headers })

    const dock = bucketResponse.data.dock || []
    const chatTool = dock.find((tool: any) => tool.name === "chat")

    if (!chatTool) {
      throw new Error(
        `No Campfire (chat) tool found in project ${projectId}. Make sure the Campfire tool is enabled on the project!`,
      )
    }

    const chatId = chatTool.id
    const targetChat = chatTool
    console.log(
      `[BasecampClient] Found Chat Tool in Dock:`,
      JSON.stringify(chatTool, null, 2),
    )

    // Basecamp dock returns url: ".../chats/{id}.json". We need to append /lines.json to post to it.
    const url = chatTool.url.replace(".json", "/lines.json")

    console.log(`[BasecampClient] Posting to Campfire at URL: ${url}`)

    const response = await axios.post(url, { content }, { headers })

    return { id: response.data.id, app_url: targetChat.app_url }
  } catch (error: any) {
    if (error.response) {
      const detailedError = new Error(
        `Basecamp API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
      )
      ;(detailedError as any).status = error.response.status
      ;(detailedError as any).data = error.response.data
      throw detailedError
    }
    throw error
  }
}

/**
 * Deletes a message from the project's Basecamp 3 Campfire.
 */
export async function deleteBasecampCampfireLine(params: {
  token: string
  accountId: string
  projectId: string
  messageId: string
}): Promise<void> {
  const { token, accountId, projectId, messageId } = params

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": `${pkg.name} (${process.env.SUPPORT_EMAIL || "raees.nazeem@growth99.com"}) v${pkg.version}`,
  }

  try {
    const bucketUrl = `https://3.basecampapi.com/${accountId}/projects/${projectId}.json`
    const bucketResponse = await axios.get(bucketUrl, { headers })

    const dock = bucketResponse.data.dock || []
    const chatTool = dock.find((tool: any) => tool.name === "chat")

    if (!chatTool) {
      throw new Error(`No Campfire (chat) tool found in project ${projectId}.`)
    }

    const baseChatUrl = chatTool.url.replace(".json", "")
    const url = `${baseChatUrl}/lines/${messageId}.json`

    console.log(`[BasecampClient] Deleting Campfire Line at URL: ${url}`)

    await axios.delete(url, { headers })
  } catch (error: any) {
    if (error.response) {
      const detailedError = new Error(
        `Basecamp API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
      )
      ;(detailedError as any).status = error.response.status
      ;(detailedError as any).data = error.response.data
      throw detailedError
    }
    throw error
  }
}

export async function updateBasecampComment(params: {
  token: string
  accountId: string
  projectId: string
  commentId: string | number
  content: string
}): Promise<any> {
  const { token, accountId, projectId, commentId, content } = params
  const url = `https://3.basecampapi.com/${accountId}/buckets/${projectId}/comments/${commentId}.json`

  console.log(`[BasecampClient] Updating comment at URL: ${url}`)

  const response = await axios.put(
    url,
    { content },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": `${pkg.name} (${process.env.SUPPORT_EMAIL || "raees.nazeem@growth99.com"}) v${pkg.version}`,
      },
    },
  )
  return response.data
}
