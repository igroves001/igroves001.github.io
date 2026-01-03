// Helper function to ensure data branch exists
export async function ensureDataBranch(GITHUB_TOKEN, GITHUB_REPO) {
    const authHeader = GITHUB_TOKEN.startsWith('github_pat_') 
        ? `Bearer ${GITHUB_TOKEN}` 
        : `token ${GITHUB_TOKEN}`;

    // Check if data branch exists
    const branchCheckResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/git/ref/heads/data`,
        {
            headers: {
                'Authorization': authHeader,
                'Accept': 'application/vnd.github.v3+json'
            }
        }
    );

    if (branchCheckResponse.status === 404) {
        // Branch doesn't exist, create it from main
        const mainBranchResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/git/ref/heads/main`,
            {
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        let sourceBranch;
        if (mainBranchResponse.ok) {
            sourceBranch = await mainBranchResponse.json();
        } else {
            // Try master branch if main doesn't exist
            const masterBranchResponse = await fetch(
                `https://api.github.com/repos/${GITHUB_REPO}/git/ref/heads/master`,
                {
                    headers: {
                        'Authorization': authHeader,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (!masterBranchResponse.ok) {
                throw new Error('Could not find default branch (main or master) to create data branch');
            }

            sourceBranch = await masterBranchResponse.json();
        }

        // Create data branch
        const createBranchResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_REPO}/git/refs`,
            {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: 'refs/heads/data',
                    sha: sourceBranch.object.sha
                })
            }
        );

        if (!createBranchResponse.ok) {
            const error = await createBranchResponse.json();
            throw new Error(error.message || 'Failed to create data branch');
        }
    } else if (!branchCheckResponse.ok) {
        const error = await branchCheckResponse.json();
        throw new Error(error.message || 'Failed to check data branch');
    }

    return authHeader;
}

