Jira Reminder
=============

Jira Issue Reminder Script in node.js.
The script can be triggered by cron.

Really dirty module, but working flawlessly (in my environment :-) ).

It sends an email to each user that has open issues.

All issues that are not complete will be listed in an Email.
They are grouped by due date.
There are 4 groups:
- overdue
- today
- tomorrow
- upcoming
- unscheduled

Example: 

![ScreenShot](https://raw.github.com/mrbrookman/jira-reminder/master/preview.png)


TODO:
- Replace Project Key in email with Project name with link.
- Add Reporter to issue tables.
- Replace preview Image in Readme with new file.
- Replace API user calls with mysql queries. Currently they are implemented because they include gravatar images.
- Query template in a sync call instead with each sendmail function.
