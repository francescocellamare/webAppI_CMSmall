import dayjs from 'dayjs';

const APIURL = 'http://localhost:3000';

function Page(id, title, creationDate, publishDate, username, blocks) {
    this.id = id
    this.title = title
    this.creationDate = creationDate
    this.publishDate = publishDate
    this.username = username
    this.blocks = blocks
}

function Block(id, type, content, rank, pageid) {
    this.id = id
    this.type = type
    this.content = content
    this.rank = rank
    this.pageid = pageid
}

/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
    // server API always return JSON, in case of error the format is the following { error: <message> } 
    return new Promise((resolve, reject) => {
        httpResponsePromise
            .then((response) => {
                if (response.ok) {

                    // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
                    response.json()
                        .then(json => resolve(json))
                        .catch(err => reject({ error: "Cannot parse server response" }))

                } else {
                    // analyzing the cause of error
                    response.json()
                        .then(obj =>
                            reject(obj)
                        ) // error msg in the response body
                        .catch(err => reject({ error: "Cannot parse server response" })) // something else
                }
            })
            .catch(err =>
                reject({ error: "Cannot communicate" })
            ) // connection error
    });
}


const getPublishedPages = async () => {
    return getJson(fetch(APIURL + '/api/pages/all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
    })).then(json => {
        return json
        .map((page) => {
            const obj = new Page(page.pageid, page.title, dayjs(page.creationDate), dayjs(page.publishDate), page.username)
            return obj
        })
    })
}

const getCreatedPages = async () => {
    return getJson( fetch(APIURL + '/api/pages/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
    })).then(json => {
        return json.map((page) => {
            const obj = new Page(page.pageid, page.title, dayjs(page.creationDate), dayjs(page.publishDate), page.username)
            return obj
        })
    })
}

const createPage = async (page, blocks) => {
    return getJson( fetch(APIURL + '/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            page: page,
            blocks: blocks
        })
    })).then( json => {
        return json
    })
}

const editPage = async (pageid, page) => {
    return getJson( fetch(APIURL + `/api/pages/${pageid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(page)
    }))
}

const login = async (credentials) => {
    return getJson( fetch(APIURL + '/api/sessions', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(credentials)
    })).then( json => {
        return json
    })
}

const deletePage = async (pageid) => {
    return getJson( fetch(APIURL + `/api/pages/${pageid}`, {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })).then( json => {
        return json
    })
}

const updateWebName = async (webname) => {
    return getJson( fetch(APIURL + '/api/webAppName', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
            name: webname
        })}).then( json => {
            return json
        })
    )}

const getWebName = async () => {
    return getJson( fetch(APIURL + '/api/webAppName', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })).then( json => {
        return json
    })
}

const logout = async () => {
    return getJson( fetch(APIURL + '/api/sessions/current', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',   
    }))
    .then( json => {
        return json
    })
}

const stillLoggedIn = async () => {
    return getJson( fetch(APIURL + '/api/sessions/current', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    }))
    .then( json => {
        return json
    })
}

const getUsers = async () => {
    return getJson( fetch(APIURL + '/api/users', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include'  
    }))
}


























/* -- HANDLE BLOCKS -- */
  
const listPublicBlocks = async (pageId) => {
    // film.watchDate could be null or a string in the format YYYY-MM-DD
    return getJson( 
        fetch(APIURL + `/api/pages/${pageId}/all`, { credentials: 'include' })
        
    ).then( json => {
      return json.map(block => {
        const Block  = {
          id: block.blockid,
          username: block.username,
          type: block.type,
          pageId: block.pageid,
          content: block.content,
          rank: block.rank
        }
        return Block;
      });
    })
  }
  

const listPrivateBlocks = async(pageId)=>{
    return getJson(
        fetch(APIURL + `/api/pages/${pageId}`, {credentials: 'include'})
    ).then(json => {
      return json.map(block => {
        const Block  = {
              id: block.blockid,
              username: block.username,
              pageId: block.pageid,
              type: block.type,
              content: block.content,
              rank: block.rank

      }
      return Block;
     } );
    })
  }

const deleteBlock = async (pageId, blockId) => {
  return getJson(
    fetch(APIURL + `/api/pages/${pageId}/${blockId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    
    )

}

const addBlock = async (pageid, block) => {
    return getJson( fetch(APIURL + `/api/pages/${pageid}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
            block: block
        })
    })).then( json => {
        return json
    })
}

const updateBlock = async (content, pageId, blockId) => {
  return getJson(
    fetch(APIURL + `/api/pages/${pageId}/${blockId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({content: content})
    },
    )
    
    
  )}

const moveBlock = async (pageId, blockId, up)=>{
  return getJson(
    fetch(APIURL + `/api/pages/${pageId}/${blockId}/move`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({move: up})
    })
  )
}



const API = { addBlock, getPublishedPages, getCreatedPages, createPage, editPage, deletePage, login, logout, stillLoggedIn, updateWebName, getWebName, getUsers, login, listPrivateBlocks, listPublicBlocks, deleteBlock , updateBlock, moveBlock }

export {Page, Block}
export default API;