import type { User, WorkspaceMember, WorkspaceRole } from "@prisma/client";
import { roleLabel } from "@/lib/auth/permissions";
import { MobileDataCard } from "@/components/ui/mobile-data-card";
import {
  TeamMemberRemoveButton,
  TeamMemberRoleSelect,
} from "@/components/settings/team-member-actions";

type MemberWithUser = WorkspaceMember & { user: User };

type TeamMembersTableProps = {
  members: MemberWithUser[];
  currentUserId: string;
  canManage: boolean;
};

function roleBadgeClass(role: WorkspaceRole): string {
  switch (role) {
    case "owner":
      return "bg-brand-50 text-brand-700";
    case "admin":
      return "bg-purple-50 text-purple-700";
    case "member":
      return "bg-gray-100 text-gray-700";
  }
}

function RoleBadge({ role }: { role: WorkspaceRole }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass(role)}`}
    >
      {roleLabel(role)}
    </span>
  );
}

function messageAccessLabel(member: MemberWithUser): string {
  if (member.status === "pending") {
    return "Invite pending";
  }
  if (member.role === "owner" || member.role === "admin") {
    return "Can create";
  }
  return member.canCreateMessages ? "Can create" : "View only";
}

function MemberStatusBadge({ member }: { member: MemberWithUser }) {
  if (member.status !== "pending") return null;
  return (
    <span className="ml-2 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      Pending invite
    </span>
  );
}

export function TeamMembersTable({
  members,
  currentUserId,
  canManage,
}: TeamMembersTableProps) {
  if (members.length === 0) {
    return (
      <p className="text-sm text-gray-500">No members found in this workspace.</p>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {members.map((member) => {
          const isSelf = member.userId === currentUserId;
          const displayName =
            member.user.name?.trim() || member.user.email.split("@")[0];
          const showActions =
            canManage && !isSelf && member.role !== "owner" && member.status === "active";

          return (
            <MobileDataCard
              key={member.id}
              title={
                <>
                  {displayName}
                  {isSelf && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      (you)
                    </span>
                  )}
                </>
              }
              subtitle={member.user.email}
              badge={<RoleBadge role={member.role} />}
              rows={[
                { label: "Messages", value: messageAccessLabel(member) },
              ]}
              actions={
                showActions ? (
                  <div className="flex flex-col gap-2">
                    <TeamMemberRoleSelect
                      memberId={member.id}
                      role={member.role}
                    />
                    <TeamMemberRemoveButton memberId={member.id} />
                  </div>
                ) : undefined
              }
            />
          );
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Member
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Role
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Messages
              </th>
              {canManage && (
                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-gray-500">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {members.map((member) => {
              const isSelf = member.userId === currentUserId;
              const displayName =
                member.user.name?.trim() || member.user.email.split("@")[0];
              const showActions =
                canManage &&
                !isSelf &&
                member.role !== "owner" &&
                member.status === "active";

              return (
                <tr key={member.id}>
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-gray-900">
                      {displayName}
                      {isSelf && (
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          (you)
                        </span>
                      )}
                      <MemberStatusBadge member={member} />
                    </p>
                    <p className="text-xs text-gray-500">{member.user.email}</p>
                  </td>
                  <td className="px-3 py-3">
                    {showActions ? (
                      <TeamMemberRoleSelect
                        memberId={member.id}
                        role={member.role}
                      />
                    ) : (
                      <RoleBadge role={member.role} />
                    )}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-600">
                    {messageAccessLabel(member)}
                  </td>
                  {canManage && (
                    <td className="px-3 py-3 text-right">
                      {showActions ? (
                        <TeamMemberRemoveButton memberId={member.id} />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
