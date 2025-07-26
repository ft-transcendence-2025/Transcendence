// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// Importing a contract to assure that only the owner can change this contract.
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SimpleStorage
/// @author Uatilla Viana Almeida
/// @notice This contract manages tournament matches with creation and update functionality
/// @dev Only the contract owner can create or update matches
contract SimpleStorage is Ownable{
    /// @notice Structure representing a single match in a tournament
    struct Match {
        uint256 tournamentId;
        uint256 matchId;
        uint256 player1; //This could be the wallet address.
        uint256 player2; //The same.
        uint256 score1;
        uint256 score2;
        uint256 winner;
        uint256 startTime; // Optional
        uint256 endTime; // Optional
        bool    exists;
    }

    /// @notice Mapping to store matches: tournamentId => matchId => matchData
    mapping(uint256 tournamentId => mapping (uint256 matchId => Match matchData)) public matches;
    
    // THIS LINE MUST BE IMPROVED TO TRACK THE MATCH COUNT MORE ROBUSTLY.
    /// @notice Mapping to store match count for each tournament
    mapping(uint256 tournamentId => uint256 matchCount) public matchCountPerTournament;

    /// @notice Event emitted when a new match is created
    event MatchCreated(
        uint256 indexed tournamentId,
        uint256 indexed matchId,
        uint256 player1,
        uint256 player2,
        uint256 score1,
        uint256 score2,
        uint256 winner,
        uint256 startTime,
        uint256 endTime
    );

    /// @notice Initializes the contract with the owner (msg.sender)
    constructor() Ownable(msg.sender) {}


    //Possible errors, to communicate off-chain.
    error MatchAlreadyExists(uint256 tournamentId, uint256 matchId);
    error InvalidPlayers();
    error InvalidWinner(uint256 winner);
    error InvalidTimeStamps();
    error MatchDoesNotExist(uint256 matchId);
    error TournamentDoesNotHaveMatches(uint256 tournamentId);

    /// @notice Creates a new match in a tournament
    /// @dev Only callable by the contract owner
    function newMatch(
        uint256 tournamentId,
        uint256 player1,
        uint256 player2,
        uint256 score1,
        uint256 score2,
        uint256 winner,
        uint256 startTime,
        uint256 endTime
    ) public onlyOwner {
        if(player1 == player2) revert InvalidPlayers();
        if(winner != player1 && winner != player2) revert InvalidWinner(winner);
        if(startTime > endTime) revert InvalidTimeStamps();

        uint256 matchId = matchCountPerTournament[tournamentId];
        if (matches[tournamentId][matchId].exists) revert MatchAlreadyExists(tournamentId, matchId);

        //Adding the data from the struct into the mapping.
        matches[tournamentId][matchId] = Match(
            tournamentId,
            matchId,
            player1,
            player2,
            score1,
            score2,
            winner,
            startTime,
            endTime,
            true
        );
        matchCountPerTournament[tournamentId]++;

        emit MatchCreated(tournamentId, matchId, player1, player2, score1, score2, winner, startTime, endTime);
    }

    /// @notice Returns the number of matches for a specific tournament
    function getMatchCount(uint256 tournamentId) public view returns (uint256 matchCount) {
        return matchCountPerTournament[tournamentId];
    }

    /// @notice Retrieves a match by tournament and match ID
    function getMatch(uint256 tournamentId, uint matchId) public view returns (
        uint256 tId,
        uint256 mId,
        uint256 pl1,
        uint256 pl2,
        uint256 scr1,
        uint256 scr2,
        uint256 win,
        uint256 sTime,
        uint256 eTime,
        bool    exists
    ) {
        Match memory m = matches[tournamentId][matchId];
        if(m.exists == false) revert MatchDoesNotExist(matchId);
        return (
            m.tournamentId,
            m.matchId,
            m.player1,
            m.player2,
            m.score1,
            m.score2,
            m.winner,
            m.startTime,
            m.endTime,
            m.exists
        );
    }

    /// @notice This function returns an array with all matches from a tournament.
    /// @return An array will all Match structs from the tournamentId.
    function getMatchesForTournament(uint256 tournamentId)
        public view returns (Match[] memory){

            uint256 totalMatches = matchCountPerTournament[tournamentId];
            //SHOULD I ADD A VERIFICATION TO CHECK IF THIS TOURNAMENT EXISTS?
            if (totalMatches == 0) revert TournamentDoesNotHaveMatches(tournamentId);
            Match[] memory result = new Match[](totalMatches);
            for (uint256 i = 0; i < totalMatches; i++){
                result[i] = matches[tournamentId][i];
            }
            return result;
        }

}