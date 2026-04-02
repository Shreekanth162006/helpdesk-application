import { Op } from 'sequelize';
import { Topic, Notification, User } from '../db/models/index.js';

async function checkSlaBreaches() {
    try {
        const now = new Date();
        const closedStatuses = ['Resolved', 'Closed'];

        // Find tickets that are overdue, not closed, and not yet escalated
        const breachedTopics = await Topic.findAll({
            where: {
                resolutionDueAt: { [Op.lt]: now },
                currentStatus: { [Op.notIn]: closedStatuses },
                isEscalated: false,
                kind: 'ticket'
            }
        });

        if (breachedTopics.length === 0) {
            return;
        }


        // Fetch all Super Admins for notifications
        const superAdmins = await User.findAll({
            where: { role: 'Super Admin', active: true },
            attributes: ['id']
        });

        for (const t of breachedTopics) {
            t.isEscalated = true;
            await t.save();

            // Fetch the ticket with relations for detailed notification
            const topic = await Topic.findByPk(t.id, {
                include: [
                    { model: User, as: 'user', attributes: ['name'] },
                    { model: User, as: 'assignedUser', attributes: ['name', 'role'] }
                ]
            });

            const customer = topic.user || { name: 'N/A' };
            const assignedUser = topic.assignedUser || { name: 'Unassigned', role: 'N/A' };
            const dueDate = topic.resolutionDueAt ? new Date(topic.resolutionDueAt).toLocaleString() : 'N/A';

            // Get all Super Admins and Managers
            const adminsAndManagers = await User.findAll({
                where: {
                    role: { [Op.in]: ['Super Admin', 'Manager'] },
                    active: true,
                },
            });

            // Create detailed notification message
            const detailedMessage = `🚨 SLA Breach Alert

Ticket #${topic.id} has breached its SLA resolution time.

Subject: ${topic.name}
Priority: ${topic.priority}
Department: ${topic.department || 'N/A'}
Assigned To: ${assignedUser.name} (${assignedUser.role || 'Agent'})
Customer: ${customer.name}
Status: ${topic.currentStatus}

Due: ${dueDate}`;

            // Send to all admins and managers
            for (const admin of adminsAndManagers) {
                await Notification.create({
                    userId: admin.id,
                    title: '🚨 SLA Breach Alert',
                    message: detailedMessage,
                    kind: 'warning',
                }).catch(err => console.error(`[SLA Service] Notification error (Admin/Manager ${admin.id}):`, err));
            }

            // Notify assigned agent (if any and not already notified as manager)
            if (t.assignedUserId && !adminsAndManagers.find(a => a.id === t.assignedUserId)) {
                await Notification.create({
                    userId: t.assignedUserId,
                    title: 'SLA BREACH: Assigned Ticket Escalated',
                    message: `Your assigned ticket "${t.name}" (#${t.id}) has breached its SLA and is now escalated.`,
                    kind: 'warning'
                }).catch(err => console.error(`[SLA Service] Notification error (Agent ${t.assignedUserId}):`, err));
            }
        }

    } catch (error) {
        console.error('[SLA Service] Error during SLA check:', error);
    }
}

let intervalId = null;

export function startSlaService(intervalMs = 3600000) { // Default 1 hour
    if (intervalId) return;

    // Run immediately on start
    checkSlaBreaches();

    // Then periodically
    intervalId = setInterval(checkSlaBreaches, intervalMs);
}

export function stopSlaService() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
}
