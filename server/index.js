'use strict';

const PORT = 3000;

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const dayjs = require('dayjs')
const app = express();
app.use(morgan('combined'));
app.use(express.json());

const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true,
};
app.use(cors(corsOptions));


const pageDao = require('./daoPage.js')
const userDao = require('./daoUser.js')

/*** Passport ***/

/** Authentication-related imports **/
const passport = require('passport');                              // authentication middleware
const LocalStrategy = require('passport-local');                   // authentication strategy (username and password)

/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, username, name).
 **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
    const user = await userDao.getUser(username, password)
    if (!user)
        return callback(null, false, 'Incorrect username or password');

    return callback(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e, id, username, name)
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) { // this user is id + username + name 
    callback(null, user);
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) { // this user is id + email + name 
    // if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
    // e.g.: return userDao.getUserById(id).then(user => callback(null, user)).catch(err => callback(err, null));
    return callback(null, user); // this will be available in req.user
});

//creation of a session
const session = require('express-session');

app.use(session({
    secret: "thisIsNotASecretButDontUseIt",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.authenticate('session'));


/**
 * login middleware
 */
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Not authenticated' })
}

const checkPrivilegies = async (req, res, next) => {
    const page = await pageDao.getPage(req.params.pageid)
    if (req.user.role === 1) {
        return next()
    }
    if (req.user.username === page.username) {
        return next()
    }
    return res.status(401).json({ error: 'Not authorized' })
}

const isLoggedInAsAdmin = (req, res, next) => {
    if (req.user.role === 1) {
        return next();
    }
    return res.status(401).json({ error: 'Not authorized' })
}

/**
 * 
 *  Authentication routes
 * 
 */



/**
 * Login
 */
app.post('/api/sessions', function (req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user) {
            return res.status(401).json({ error: info });
        }
        req.login(user, (err) => {
            if (err)
                return next(err);

            return res.json(req.user);
        });
    })(req, res, next);
});

/**
 * Still logged-in
 */
app.get('/api/sessions/current', (req, res) => {
    if (req.isAuthenticated()) {
        return res.status(200).json(req.user);
    }
    else
        return res.status(401).json({ error: 'Not authenticated' });
});

/**
 * Logout
 */
app.delete('/api/sessions/current', (req, res) => {
    req.logout(() => {
        return res.status(200).json({});
    });
});



app.get('/api/users', isLoggedIn, isLoggedInAsAdmin, async (req, res) => {
    try {
        const result = await userDao.getUsers()
        return res.status(200).json(result)
    }
    catch (err) {
        return res.status(500).json({ error: err })
    }
})









/**
 *  Managing pages
 */


/**
 * Create a new page
 */
app.post('/api/pages', isLoggedIn, async (req, res) => {
    try {
        const page = req.body.page
        const blockList = req.body.blocks                                       // block contraints are enforced in the front end

        if(!page.title || page.title === '')
            return res.status(400).json({error: 'no title'})
        if(!blockList.some( block => block.type === 'header') || !blockList.some( block => block.type !== 'header'))
            return res.status(400).json({error: 'no header and/or other types'})
        // username and creationDate are automatically assigned by the system
        page.username = req.user.username
        page.creationDate = dayjs().format('MM/DD/YYYY')
        page.publishDate = req.body.page.publishDate || ''                  // if it's draft we should receive undefined so it is saved as empty string in the database (also frontend)

        // return the pageid for linking each block
        const pageid = await pageDao.addPage(page)
        let result
        for (let block of blockList) {
            // return NULL if operation succeed
            if(block.content === '') continue;
            result = await pageDao.addBlock(block, pageid, page.username)
            if (result !== null)
                return res.status(500).json({ error: err })
        }
        return res.status(200).json({ message: 'page is created' })
    }
    catch (err) {
        return res.status(500).json({ error: err });
    }
})

app.post('/api/pages/:pageid/block', isLoggedIn, checkPrivilegies, async (req, res) => {
    try {
        
        const block = req.body.block
        const pageid = req.params.pageid
        const page = await pageDao.getPage(pageid)
        if(block.content === '') return res.status(400).json({ error: 'empty content' });

        const result = await pageDao.addBlock(block, pageid, page.username)
        if (result !== null)
            return res.status(500).json({ error: err })
        return res.status(200).json( {message: 'done'} )
    }
    catch(err) {
        return res.status(500).json({ error: err })
    }
})

/**
 * used for front-office pages
 */
app.get('/api/pages/all', async (req, res) => {
    try {
        const result = await pageDao.getPublishedPages();
        return res.status(200).json(result)

    } catch (err) {
        return res.status(500).json(err)
    }
})


/**
 * get pages for logged-in users
 */
app.get('/api/pages/', isLoggedIn, async (req, res) => {
    try {
        const result = await pageDao.getCreatedPages();
        return res.status(200).json(result)

    } catch (err) {
        return res.status(500).json(err)
    }
})


/**
 * Get full set of blocks linked to a given pageid (PUBLIC PAGES)
 */
app.get('/api/pages/:pageid/all', async (req, res) => {
    try {
        const result = await pageDao.getPublishedBlocks(req.params.pageid)
        return res.status(200).json(result)
    }
    catch (err) {
        return res.status(500).json({ error: err })
    }
})

/**
 * Get full set of blocks linked to a given pageid and username (PRIVATE PAGES)
 */
app.get('/api/pages/:pageid', isLoggedIn, async (req, res) => {
    try {
        const result = await pageDao.getCreatedBlocks(req.params.pageid)
        return res.status(200).json(result)
    }
    catch (err) {
        return res.status(500).json({ error: err })
    }
})

/**
 * Edit ONLY page information
 */
app.put('/api/pages/:pageid', isLoggedIn, checkPrivilegies, async (req, res) => {
    try {
        // manage maliciuos changes in the author name by a common user
        if (!req.user.role)
            req.body.username = req.user.username
        if(req.body.username === null || req.body.username === undefined)
            req.body.username = req.user.username
        
        const page = req.body
        if (!page.title || !page.publishDate)
            return res.status(400).json({ message: 'body is not complete' })

        const result = await pageDao.editPage(page, req.params.pageid)
        return res.status(200).json(await pageDao.getPage(req.params.pageid))
    }
    catch (err) {
        return res.status(500).json({ error: err })
    }
})

/**
 * Edit a single block given the blockid
 */
app.put('/api/pages/:pageid/:blockid', isLoggedIn, checkPrivilegies, async (req, res) => {
    try {
        const blockInfo = req.body
        blockInfo.username = req.user.username //<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

        if (!blockInfo.content)
            return res.status(400).json({ message: 'body is not complete' })

        if (blockInfo.rank)
            return res.status(400).json({ message: 'rank can not be changed' })

        const result = await pageDao.editBlock(blockInfo, req.params.pageid, req.params.blockid)
        return res.status(200).json(await pageDao.getBlock(req.params.pageid, req.params.blockid))
    }
    catch (err) {
        return res.status(500).json({ error: err })
    }
})

/**
 * Delete a page and its blocks given a pageid 
 */
app.delete('/api/pages/:pageid', isLoggedIn, checkPrivilegies, async (req, res) => {
    try {
        let result = await pageDao.deleteBlocksByPageId(req.params.pageid)
        if (result !== null)
            return res.status(500).json({ error: result })
        result = await pageDao.deletePage(req.params.pageid)
        if (result === null)
            return res.status(200).json({ message: 'page deleted' })
    }
    catch (err) {
        return res.status(500).json({ error: err })
    }
})

/**
 * Delete a SINGLE block
 */
app.delete('/api/pages/:pageid/:blockid', isLoggedIn, checkPrivilegies, async (req, res) => {
    try {
        const result = await pageDao.deleteBlock(req.params.blockid, req.params.pageid)
        if (result === -1)
            return res.status(400).json({ error: 'block can not be deleted' })
        if (result === null)
            return res.status(200).json({ message: 'block deleted' })
    }
    catch (err) {
        return res.status(500).json({ error: err })
    }
})


/**
 * Website name setter for ADMIN
 */
app.post('/api/webAppName', isLoggedIn, isLoggedInAsAdmin, async (req, res) => {

    try {
        const newName = req.body.name;
        const result = await pageDao.updateWebName(newName);
        return res.status(200).json(JSON.parse(result))
    } catch (err) {
        return res.status(500).json({ error: err });
    }
})

/**
 * Website name getter
 */
app.get('/api/webAppName', async (req, res) => {
    try {
        const name = await pageDao.getWebName();
        return res.status(200).json(name);
    } catch (err) {
        return res.status(500).json({ error: err });
    }
})

/**
 * Edit the rank for a block, used during creation or edit of the page
 */
app.put('/api/pages/:pageid/:blockid/move', isLoggedIn, checkPrivilegies, async (req, res) => {
    try {
        const move = req.body.move
        if (move != 'up' || move != 'down'){
            let result = await pageDao.moveBlock(req.params.pageid, req.params.blockid, move)
            return res.status(200).json(result)   
        }
        else 
            return res.status(400).json({ message: 'bad request' })
    } catch (err) {
        return res.status(500).json({ error: err });
    }
})

app.listen(PORT,
    () => { console.log(`Server started on http://localhost:${PORT}/`) });