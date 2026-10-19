export const getResultData = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  return response?.data || [];
};

export const getEntityId = (value) => {
  if (!value) return null;

  if (typeof value === "object") {
    return value._id || value.value || null;
  }

  return value;
};

export const findHODPosition = async (client) => {
  /*
   * First try an exact match.
   */
  const exactResponse = await client.service("positions").find({
    query: {
      name: "HOD",
      $limit: 1,
    },
  });

  const exactPosition = getResultData(exactResponse)[0];

  if (exactPosition) {
    return exactPosition;
  }

  /*
   * Fallback for values such as "Hod", "hod" or values with spaces.
   */
  const allPositionsResponse = await client.service("positions").find({
    query: {
      $limit: 10000,
    },
  });

  return getResultData(allPositionsResponse).find(
    (position) =>
      String(position?.name || "").trim().toUpperCase() === "HOD",
  );
};

export const updateEmployeePositionToHOD = async ({
  client,
  employeeId,
  hodPositionId,
  userId,
}) => {
  if (!employeeId) {
    throw new Error("The selected department head is invalid.");
  }

  if (!hodPositionId) {
    throw new Error('A position named "HOD" could not be found.');
  }

  return client.service("employees").patch(employeeId, {
    position: hodPositionId,
    updatedBy: userId,
  });
};