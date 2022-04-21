const axios = require('axios').default;
const fs = require('fs');
const path = require('path');
const csv = require('@fast-csv/format');
require("dotenv").config();

const seedOrgUser = process.argv[2];

// Self executing function
(async () => {
    const orgRows = [
        ['login', 'avatar_url', 'url', 'html_url'],
    ];
    const userRows = [
        ['login', 'avatar_url', 'url', 'html_url'],        
    ];
    const repoRows = [
        ['login', 'full_name', 'description', 'html_url']
    ];
    const repoLanguageRows = [
        ['full_name', 'name']
    ];
    const contributorRows = [
        ['full_name', 'login', 'contributions']
    ];

    const seedOrgUserObj = await axios(`https://api.github.com/users/${seedOrgUser}`, {
        headers: {
            "Authorization": `token ${process.env.GITHUB_TOKEN}`
        }
    });
    if (seedOrgUserObj.data.type === 'User') {
        userRows.push([seedOrgUserObj.data.login, seedOrgUserObj.data.avatar_url, seedOrgUserObj.data.url, seedOrgUserObj.data.html_url]);
    } else {
        orgRows.push([seedOrgUserObj.data.login, seedOrgUserObj.data.avatar_url, seedOrgUserObj.data.url, seedOrgUserObj.data.html_url]);
    }

    const repos = await axios(`https://api.github.com/users/${seedOrgUser}/repos`, {
        headers: {
            "Authorization": `token ${process.env.GITHUB_TOKEN}`
        }
    });
    
    for (let repo of repos.data) {
        if (repo.fork === false) {
            repoRows.push([seedOrgUserObj.data.login, repo.full_name, repo.description, repo.html_url]);
            const languages = await axios(repo.languages_url, {
                headers: {
                    "Authorization": `token ${process.env.GITHUB_TOKEN}`
                }
            });
            for (let language in languages.data) {
                repoLanguageRows.push([repo.full_name, language]);
            }
            const contributors = await axios(repo.contributors_url, {
                headers: {
                    "Authorization": `token ${process.env.GITHUB_TOKEN}`
                }
            });
            for (let contributor of contributors.data) {
                userRows.push([contributor.login, contributor.avatar_url, contributor.url, contributor.html_url]);
                contributorRows.push([repo.full_name, contributor.login, contributor.contributions]);
            }
        }
    }
    
    csv.writeToPath(path.resolve(__dirname, 'contributors.csv'), contributorRows)
            .on('error', (err) => console.error(err));
    csv.writeToPath(path.resolve(__dirname, 'repo-languages.csv'), repoLanguageRows)
            .on('error', (err) => console.error(err));
    csv.writeToPath(path.resolve(__dirname, 'repos.csv'), repoRows)
            .on('error', (err) => console.error(err));
    csv.writeToPath(path.resolve(__dirname, 'orgs.csv'), orgRows)
            .on('error', (err) => console.error(err));
    csv.writeToPath(path.resolve(__dirname, 'users.csv'), userRows)
            .on('error', (err) => console.error(err));
})();