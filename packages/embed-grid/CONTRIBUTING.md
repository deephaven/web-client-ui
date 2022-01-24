# Contributing

When contributing to the Web UI source, please follow our internal code branching/review process: https://wiki-internal.illumon.com/Internal/Illumon_GitFlow_Code_Review_Process

Note that some of these steps don't apply as much to web contributions. A step-by-step guide is provided below.

In addition, the unit tests for web must all pass (run `npm test`).

## Setting up for dev

1.  Checkout latest of the branch the ticket release targets (e.g. web/powell, rc/treasureplus)
2.  Create new branch named yourname_IDS-#### based on the target branch
    ```
    git checkout web/powell
    git pull
    git checkout -b yourname_IDS-####
    ```
3.  Update ticket status in Aha! to “In Development”
4.  Add branch name to the field in Aha!

## Development

1.  Develop feature/fix and commit
2.  Ensure unit tests pass with `npm test`

## Rebasing before review

1.  Before going to review (and before merge request), you should rebase your branch on top of the base. This applies all of your commits after the latest commit in the base branch.
    ```
    git fetch origin
    git rebase origin/web/powell (or whatever the starting branch was)
    ```
2.  Fix any rebase issues git gives you (usually avoided by making sure you do not perform a merge at any point in development), then `git push -f`

## Posting for review

1.  Post to reviewboard. You can use the rb bash script given on the [internal wiki GitFlow page](https://wiki-internal.illumon.com/Internal/Illumon_GitFlow_Code_Review_Process). Usage is `rb baseBranch new IDS-####` for initial review
2.  Go to the reviewboard link and assign a reviewer (like Bender)
3.  Update the review name to match the Aha! ticket description (IDS-####: Description)
4.  Put what testing you did or testing that needs to be done
5.  Copy that same testing to the testing plan box on Aha! (unless final testing needs to be more thorough, different)
6.  Publish reviewboard request. The request defaults to a draft state.
7.  Copy reviewboard link to the space in Aha!
8.  Move Aha! status to “Ready to review”
9.  Add the reviewer you added on reviewboard to the Code Reviewer slot in Aha!

## Review comments

1.  Address any needed updates from review.
2.  Rebase on top of the base branch again
3.  Update reviewboard entry. Using the bash script from wiki, syntax is `rb baseBranch update updateMsg`
4.  Go to reviewboard site and publish the update

## Merge Request

1.  Once no more updates are needed, rebase one last time.
    ```
    git fetch origin
    git rebase origin/web/powell (or whatever the starting branch was)
    git push -f
    ```
2.  If committing to `web/branch`, skip this step. If committing to `rc/branch`, update the changelog for the release (e.g. powell) and bump the version number for the release in `gradle/` which is at the root of the entire repo
3.  Submit a merge request on Gitlab. Source is your branch, target is the base (e.g. web/powell)
4.  Title the merge request to match the Aha! name (IDS-####: Description)
5.  Click the edit button on the right side of reviewers and add someone (e.g. Bender)
6.  Check the 2 boxes to delete branch and squash commits on merge
7.  Submit request
8.  Copy gitlab link to the Merge Request field in Aha!
9.  Close reviewboard item by marking as submitted

## Finalizing

1.  Once merge is complete, check that Aha! has a branch name, reviewboard link, reviewer, merge request link, test plan (if needed), and documentation required (if needed)
2.  Update Aha! to “Ready to test” (or “Ready to ship” if it’s a dev only ticket that doesn’t impact prod systems at all)

## Exceptions

Very small/quick changes/fixes (like a typo in a config file) may skip reviewboard and go straight to a merge request. This is pretty rare, and you should verify w/ the team before skipping reviewboard.
