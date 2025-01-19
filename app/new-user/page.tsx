import { prisma } from "@/util/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const createNewUser = async () => {
  const user = await currentUser();
  if (!user) {
    console.error("User is null");
    return;
  }
  console.log(user);

  const match = await prisma.user.findUnique({
    where: {
      clerkId: user.id as string,
    },
  });

  if (!match) {
    await prisma.user.create({
      data: {
        clerkId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user?.emailAddresses[0].emailAddress,
        phoneNumber: user?.phoneNumbers[0].phoneNumber,
      },
    });
  }

  redirect("/projects");
};

const NewUser = async () => {
  await createNewUser();
  return <div>...loading</div>;
};

export default NewUser;
